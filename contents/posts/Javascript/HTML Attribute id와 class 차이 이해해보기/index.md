---
url: "html-class-vs-id"
title: "HTML Attribute의 id와 class 차이 이해해 보기"
description: "우아한테크코스 레벨 1 로또 미션을 진행하면서 HTML 어트리뷰트 중 id와 class의 차이에 대해 학습한 내용을 기록합니다 :)"
date: 2024-03-04
update: 2024-03-04
series: "Javascript"
tags:
  - HTML
  - Javascript
  - 우아한테크코스
---

### 서론

```html
<button id="modal-cancel-button" class="cancel-button text-m">X</button>
```

3주차 로또 미션을 진행할 때, 정말 자연스럽게 id와 class를 혼용해서 사용했다.

너무나도 자연스럽게 id는 특정 HTML 요소를 자바스크립트에서 접근할 때 사용했고, class는 스타일을 적용할 때 사용했었는데 어떤 이유로 이렇게 구분지어 사용한건지 id와 class의 차이점을 알아보며 학습하고자 한다!

## ID

id는 HTML 문서 전체에서 한 엘리먼트를 유일하게 식별해야할 때 사용할 수 있다.

```html
<button id="some-id">X</button>
```

```css
somd-id{
  some-style...
}
```

```js
const someDOM = document.getElementById("some-id")
```

`#`를 사용해서 스타일을 적용할 수 있고, getElementById를 사용해서 특정 id를 가진 HTML 요소에 접근할 수 있다.

id는 다음과 같은 특징을 가진다.

### 1. 한 요소는 오직 하나의 id만 가질 수 있다, 여러 요소가 동일한 id를 가질 수 없다.

```html
<h1 id="my-name">Harry</h1>
<h1 id="my-name">Hyun</h1>
```

```js
const myName = document.getElementById("my-name")

console.log(myName) // <h1 id="my-name">Harry</h1>
```

동일한 id를 가진 2개의 h1요소를 getElementById로 접근하면 첫 번째 h1 요소만 접근하게된다. id는 전체 HTML 문서에서 유일하기 때문에 특정 요소를 빠르게 찾아야 할 때 유용하게 활용할 수 있다.

## 2. id 이름에 공백이 있다면 공백마저 id 이름으로 취급한다.

공백을 통해 구분하는 class와는 달리, id에 공백이 있다면 그 공백마저 하나의 id에 포함시키기 때문에 공백으로 혼란을 줄 수 있는 상황은 피하는게 좋다.

```html
<h1 id="my name">Harry</h1>
// id : my name
```

```js
const myName = document.getElementById("my name")
console.log(myName) // <h1 id="my-name">Harry</h1>
```

### 3. css 선택자 우선순위가 class보다 높다.

```html
<h1 id="my-name" class="harry">Harry</h1>
```

```css
#my-name {
  color: red;
}

.harry {
  color: blue;
}
```

id와 class를 모두 사용해서 스타일을 지정할 경우 id가 우선순위가 더 높기 때문에 텍스트의 색상이 red가 된다.  
위에서 확인할 수 있듯이, 전체 HTML 문서에서 오직 하나의 요소에 빠르게 접근하기 위해 id를 사용해볼 수 있다. 하지만, 스타일이나 동작이 같은 여러개의 HTML 요소들을 유형별로 구분하기 위해서는 class 사용이 더 적합할 수 있다.

## Class

class는 id와 달리 한 HTML 문서 내에서 중복해서 사용될 수 있고, 하나의 HTMl 요소는 여러개의 클래스를 가질 수 있어 스타일과 동작을 유형별로 묶을 때 활용할 수 있다.

```html
<h1 class="harry">Harry</h1>
```

```css
.harry {
  color: blue;
}
```

```js
const myName = document.querySelector(".harry")
const myName = document.getElementsByClassName("harry")
const myNameList = document.querySelectorAll("harry")
```

`.`을 사용해서 스타일을 적용할 수 있고, class 이름을 인자로 넘기는 메서드들을 활용해서 특정 class를 가진 HTML 요소에 접근할 수 있다.

class는 다음과 같은 특징을 가진다.

### 1. 중복이 가능하다.

- 스타일 중복

한 HTMl 요소는 여러개의 class를 가질 수 있다. 이를 활용해서 비슷한 스타일과 동작을 가지는 요소들을 유형별로 묶을 수 있다.

```html
<div class="flex justify-between">
  <span class="text-sm font-light">당첨 번호</span>
  <span class="text-sm font-light">보너스 번호</span>
</div>
<div class="flex justify-between">
  <div id="winning-lotto-input-container" class="flex gap-x-1"></div>
  <div id="bonus-number-input-container"></div>
</div>
```

로또 미션 step2를 진행하면서 작성했던 HTML 코드이다.

```css
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.text-m {
  font-size: 2.1rem;
}

.font-light {
  font-weight: lighter;
}
```

여러 요소들에 중복해서 사용되는 스타일들을 class를 통해서 정의하고 해당 스타일이 필요한 요소에서 class 이름을 중복해서 사용함으로써 스타일을 적용하고 있다. 만약 id를 사용해서 스타일을 정의했을 경우 오직 하나의 HTML 요소에만 적용할 수 있기 때문에 스타일이 같더라도 새로운 요소를 만들 때마다 중복해서 같은 스타일을 지정해줘야 하는 불편함이 있을 것이다.

- 동작 중복

```js
static #renderWinningLottoInputs() {
if (!WinningLottoForm.#isEmptyHTML(WinningLottoForm.#winningLottoContainer))
return;

    WinningLottoForm.#winningLottoContainer.innerHTML = `<inputtype="number"
        class="text-h-center winning-input winning-lotto-input"
        id="winning-number-input"
        required
        min="1"
        max="45"/>`.repeat(6);

}
```

6개의 input 요소들이 모두 당첨 번호와 관련되어 있어 동일한 class 이름(winning-lotto-input)을 설정하고, querySelectorAll 메서드를 사용해서 한번에 참조할 수 있었다.

### 2. className, classList API

한 HTML 요소는 여러개의 class를 가질 수 있기 때문에 자바스크립트는 해당 클래스들을 조작할 수 있도록 className, classList API를 제공한다.

- className

특정 HTML 요소의 클래스 이름들을 문자열 형태로 참조한다.

```html
<h1 class="harry hyun woong">Harry</h1>
```

```js
const myName = document.querySelector(".harry")
console.log(myName.className) // harry hyun woong
console.log(typeof myName.className) // string

myName.className = "styles"
```

해당 요소의 모든 클래스 이름들을 하나의 문자열 형태로 참조할 수 있고, 클래스 이름에 다른 문자열을 할당해서 스타일이나 동작을 변경할 수도 있다. 한 요소가 너무 많은 클래스 이름들을 가진다면 문자열을 직접 할당해서 변경하는 것 보다 classList 에서 제공하는 메서드들을 통해 클래스 이름들의 구성을 변경할 수 있다.

- classList

classList는 읽기 전용 프로퍼티이며, remove와 add등 한 요소의 클래스 이름들의 구성을 변경할 수 있는 유용한 메서드를 제공한다.

```js
const myName = document.querySelector(".harry")
console.log(myName.classList) // harry hyun woong
console.log(myName.classList[0]) // harry

myName.classList[0] = "choi" // error
```

인덱스를 통해서 여러개의 클래스 중 하나의 클래스 이름을 참조할 수 있으며, 읽기 전용 프로퍼티이기 때문에 할당을 통해서 변경하려고 하는 경우 에러가 발생한다.

```html
<form id="winning-lotto-form" class="hidden winning-lotto-form"></form>
```

```css
.hidden {
  visibility: hidden;
}
```

```js
static renderWinningLottoForm() {
	WinningLottoForm.#winningLottoForm.classList.remove("hidden");
	//...
}

static hideWinningLottoForm() {
WinningLottoForm.#winningLottoForm.classList.add("hidden");
}
```

위 코드는 이번 미션을 진행할 때, 당첨 결과 모달을 렌더링하거나 숨기기 위해서 구현한 메서드들이다. remove 메서드를 사용해서 클래스의 이름들 중 hidden을 지우면 모달이 렌더링 되고 add 메서드를 통해서 hidden을 추가하면 모달이 숨겨진다. remove, add 이외에도

- contains: 클래스 이름들 중 특성 클래스를 포함하는지를 확인한다.
- replace(oldClass, newClass): void, 기존의 클래스들에서 새로운 클래스들로 변경한다.

등 다양한 메서드들을 제공한다.
