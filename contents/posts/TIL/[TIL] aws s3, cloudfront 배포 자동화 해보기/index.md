---
url: "til-frontend-deploy"
title: "[TIL] aws s3, cloudfront 배포 자동화 해보기"
description: "우아한테크코스 레벨 3 프로젝트를 진행하면서 프론트엔드 배포 자동화 yml 파일 설정을 통해 배운점을 기록합니다 :)"
date: 2024-08-12
update: 2024-08-12
series: "TIL"
tags:
  - TIL
  - 우아한테크코스
---

## 모모 프론트엔드 배포 자동화 도전!

6주 동안 모모 서비스 개발을 진행하면서, 프론트엔드 작업이 배포가 되어야 하는 상황에 매번 aws에 로그인을 하고, s3 버킷에 새로운 리소스들을 업로드하고, cloudfront의 캐싱을 무효화 하는 작업을 수동으로 했었다. 더이상 이럴 수 없다는 생각이 들어 페드로와 함께 프론트엔드 배포 자동화를 진행했다. 아래는 배포를 자동화하기 위한 yml 파일을 설정하면서 배운 내용들이다!

### 프론트엔드 배포 yml 파일에서 사용되는 키워드

- github actions
- self-hosted
- aws s3, cloudfront

### on

develop 브랜치에서 시작해서

- 새로운 기능(feature)를 구현하고,
- develop 브랜치로 PR(Pull Request)를 생성하고,
- 코드 리뷰를 주고 받다가 develop 브랜치로 머지가 될 때 Frontend CD workflow를 실행한다.

깃허브 이벤트에는 merge가 존재하지 않으므로, develop 브랜치에 push가 되었을 때 워크 플로우를 실행한다.

```shell
name: Frontend CD

on:
  push:
    branches: ["develop"]

permissions:
  checks: write
```

## jobs

### 1) detect-changes

```shell
detect-changes:
  runs-on: ubuntu-latest
  permissions:
    pull-requests: read
  outputs:
    backend: ${{ steps.filter.outputs.backend }}
    frontend: ${{ steps.filter.outputs.frontend }}
  steps:
    - uses: actions/checkout@v4 # Push 이벤트이기 때문에 checkout 해야 함
      with:
        ref: develop
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        base: "develop" # 해당 브랜치의 last commit과 변경점 비교
        filters: |
          backend:
            - 'backend/**'
          frontend:
            - 'frontend/**'
```

백엔드의 PR이 머지되어 develop 브랜치에 push 이벤트가 발생할 경우에는 프론트엔드 CD 워크플로우가 실행될 필요가 없기 때문에, `detect-changes` job을 활용한다. `detect-change`는 `develop` 브랜치의 last commit과 PR에서의 backend, frontend 폴더 내부의 commit들과 비교해서 비교 결과를 outputs의 frontend, backend에 각각 담는 작업을 수행하는 job이다.

### 2) fe-build

```shell
fe-build:
  needs: detect-changes # jobs들은 병렬로 실행됨, needs 키워드를 사용해서 특정 job이 완료(성공)면 실행하도록 설정
  if: ${{ needs.detect-changes.outputs.frontend == 'true' }}
  runs-on: ubuntu-latest
  defaults:
    run:
      shell: bash
      working-directory: ./frontend

  steps:
  - name: 모모 레파지토리의 코드를 가져와요 :)
    uses: actions/checkout@v4

  - name: 노드 버젼을 설정해요 :)
    uses: actions/setup-node@v4
    with:
      node-version: "lts/*"

  - name: 이전 의존성을 저장해둔게 있나~? 확인해요 :)
    id: cache
    uses: actions/cache@v4
    with:
      path: "frontend/node_modules"
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-node-
        ${{ runner.os }}

  - name: package-lock.json을 활용해서 의존성을 깨끗하게 설치해요 :)
    if: steps.cache.outputs.cache-hit != 'true'
    run: npm ci

  - name: .env 파일을 생성해요 :)
    run: |
      echo "${{ secrets.MOMO_FE_ENV }}" >> .env

  - name: 프론트엔드 리소스를 빌드해요 :)
    run: npm run build

  - name: 프론트엔드 리소스 결과물을 깃허브 레파지토리 artifacts로 업로드해요
    uses: actions/upload-artifact@v4
    with:
      name: momoResources
      path: frontend/dist
```

**1) needs**

**깃허브 워크플로우에서 각 job들은 병렬로(동시에) 실행**되기 때문에, 만약 A job이 B job의 결과에 영향을 받는다면 A job에서 `needs`를 활용해서 B job이 끝나기를 기다려야 한다는 것을 명시한다. fe-build는 detect-change의 결과에 따라서 실행을 할지 말지 결정되기 때문에 needs에 detect-change를 추가한다. detect-change job의 결과물에서 frontend에 변경사항이 있으면, 프론트엔드 리소스들을 빌드하기 위한 job을 수행한다.

**2) working-directory: ./frontend**

workding-directory가 ./frontend라는 것은 워크플로우를 실행하는 깃허브 서버에서 `cd frontend` 명령어를 입력하는 것과 같다. npm ci, npm run build와 같은 명령어를 실행하려면 frontend 경로 내부에서 실행해야 하기 때문에 ./frontend경로로 이동해서 작업들을 수행할 것을 명시한다.

**3) actions/checkout@v4**

checkout은 깃허브 서버에 모모 레파지토리 코드를 가져오는 역할을 한다. 즉, 깃허브 서버에 git clone 명령어를 입력하는 것과 같다. checkout을 하면 워크플로우를 실행하는 깃허브 서버의 한 디렉터리에 모모 레파지토리 코드들이 다운로드된다. 100% 확실하지는 않은 경로지만 대략적으로 아래와 같이 디렉터리들이 만들어진다.

- `/home/runner/work/2024-momo/frontend-cd/frontend`
- `/home/runner/work/2024-momo/frontend-cd/backend`

**4) upload-artifact**

working-directory가 ./frontend이기 때문에 모모 레파지토리에 있는 frontend 디렉터리로 이동해서, 의존성(package.json)들을 설치하고, env 파일을 설정하고 npm run build를 실행한다. 빌드까지 완료되면 위에서 언급한 대략적인 디렉터리에 즉, `/home/runner/work/2024-momo/frontend-cd/frontend/dist` 해당 디렉터리에 빌드 결과물들이 생긴다. 이제 `artifacts`에 `frontend/dist` 경로에 있는 결과물을 임시저장한다. 깃허브 `artifacts`는 워크플로우 실행 중에 생성된 파일이나 결과물을 임시로 저장하고, 다른 워크플로우 단계에서 다운로드해서 사용할 수 있는 임시 저장소 역할을 한다.

### 3) deploy

```shell
deploy:
  needs: fe-build
  runs-on: self-hosted
  env:
    CLOUD_FRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID}}
  steps:
    - name: 모모 깃허브 레파지토리 artifacts로 부터 빌드 결과물을 다운받아요 :)
      uses: actions/download-artifact@v4
      with:
        name: momoResources
        path: ./frontend/dist
    - name: aws에 배포하고 cloudfront 캐싱을 무효화해요
      working-directory: ./frontend/dist/
      run: |
        aws s3 sync ./ s3://techcourse-project-2024/momo --delete
        aws cloudfront create-invalidation --distribution-id "$CLOUD_FRONT_DISTRIBUTION_ID" --paths "/*"
```

**1) self-hosted**

깃허브 서버(ubunt-lastes)를 사용하는 것이 아니라, self-hosted를 사용하는 이유는 깃허브 서버에서 우아한테크코스 aws에 접근할 수 있는 방법이 없기 때문이다. IAM 키를 발급받을 수 없는 환경이기 때문에, 우아한테크코스 aws에서 생성한 EC2 인스턴스에서 deploy job을 실행해야 한다.

`aws s3 sync`, `aws cloudfront …` 와 같은 aws 명령어를 실행하기 위해서는 EC2 인스턴스에 `aws cli`가 설치되어 있어야 한다.

**2) download-artifact**

깃허브 artifacts에 저장한 momoResource를 EC2 인스턴스의 ./frontend/dist 경로에 다운로드 받는다. 깃허브 artifacts는 upload 할 때, 사용했던 name기준으로 찾는다.

> **\*Downloading files**: You can only download artifacts that were uploaded during the same workflow run. When you download a file, you can reference it by name.
> 파일 다운로드: 동일한 워크플로 실행 중에 업로드된 아티팩트만 다운로드할 수 있습니다. 파일을 다운로드할 때 이름으로 파일을 참조할 수 있습니다.\*

[참고](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/storing-workflow-data-as-artifacts#about-workflow-artifacts)

**3) aws s3 sync**

aws s3 sync는 자동으로 변경을 감지하여 변경 사항이 있는 파일들만 s3 버킷과 동기화 한다. 즉, 현재 s3 버킷에 저장되어 있는 리소스들과, 새롭게 빌드된 리소스들을 비교를 해서 변경 사항이 있는 파일들만 동기화 하는 작업을 수행한다.

**4) aws cloudfront create-invalidation**

cloudfront의 역할 중에는 s3 버킷에 저장된 리소스들을 캐싱하는 역할도 있다. 만약 s3 버킷에는 새로운 리소스들이 업로드 되어 있지만, cloudfront는 여전히 예전 리소스들을 캐싱하고 있다면 새로운 버젼이 릴리즈되었음에도 불구하고 사용자에게 이전 버젼의 서비스를 제공할 수도 있는 문제가 발생한다. 이 문제가 발생하지 않도록 하기 위해서 create-invalidation 명령어를 통해서 cloudfront의 캐싱을 무효화한다. 리액트 쿼리의 `queryClient.invalidateQueries` 와 비슷하다.

아래는 전체 yml 파일 구성이다.

```shell
name: 모모 프론트엔드 배포 자동화 워크플로우

on:
  push:
    branches: ["develop"]

permissions:
  checks: write

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
      - uses: actions/checkout@v4 # Push 이벤트이기 때문에 checkout 해야 함
        with:
          ref: develop
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          base: "develop" # 해당 브랜치의 last commit과 변경점 비교
          filters: |
            backend:
              - 'backend/**'
            frontend:
              - 'frontend/**'

  fe-build:
    needs: detect-changes # jobs들은 병렬로 실행됨, needs 키워드를 사용해서 특정 job이 완료(성공)면 실행하도록 설정
    if: ${{ needs.detect-changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    defaults:
      run:
        shell: bash
        working-directory: ./frontend

    steps:
      - name: 모모 레파지토리의 코드를 가져와요 :)
        uses: actions/checkout@v4

      - name: 노드 버젼을 설정해요 :)
        uses: actions/setup-node@v4
        with:
          node-version: "lts/*"

      - name: 이전 의존성을 저장해둔게 있나~? 확인해요 :)
        id: cache
        uses: actions/cache@v4
        with:
          path: "frontend/node_modules"
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
            ${{ runner.os }}

      - name: package-lock.json을 활용해서 의존성을 깨끗하게 설치해요 :)
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci

      - name: .env 파일을 생성해요 :)
        run: |
          echo "${{ secrets.MOMO_FE_ENV }}" >> .env

      - name: 프론트엔드 리소스를 빌드해요 :)
        run: npm run build

      - name: 프론트엔드 리소스 결과물을 깃허브 레파지토리 artifacts로 업로드해요
        uses: actions/upload-artifact@v4
        with:
          name: momoResources
          path: frontend/dist

  deploy:
    needs: fe-build
    runs-on: self-hosted
    env:
      CLOUD_FRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID}}
    steps:
      - name: 모모 깃허브 레파지토리 artifacts로 부터 빌드 결과물을 다운받아요 :)
        uses: actions/download-artifact@v4
        with:
          name: momoResources
          path: ./frontend/dist
      - name: aws에 배포하고 cloudfront 캐싱을 무효화해요
        working-directory: ./frontend/dist/
        run: |
          aws s3 sync ./ s3://techcourse-project-2024/momo --delete
          aws cloudfront create-invalidation --distribution-id "$CLOUD_FRONT_DISTRIBUTION_ID" --paths "/*"
```

## 느낀점

이전에 `aws amplify`를 사용해서 배포를 했었을 때는, aws에서 알려주는대로 버튼만 클릭하면 알아서 모든 것을 해줬다. 심지어 yml 파일을 만들 필요도 없었다. 하지만 이번에 배포 자동화를 위한 yml 파일을 직접 만들면서 초반에는 이해하기 힘들었지만, 각 job들을 수행하기 위한 명령어들을 평소에 내가 자주 사용하는 명령어로 비유해서 이해를 시도하니 쉽게 이해할 수 있었다. (cd frontend, git clone과 같은…)

이제 merge 버튼만 클릭하면 프론트엔드 배포가 알아서 된다니… 너무 편하게 개발할 수 있을 것 같다!

- PR 링크 : https://github.com/woowacourse-teams/2024-momo/pull/212
