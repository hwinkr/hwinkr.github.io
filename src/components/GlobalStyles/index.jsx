import { createGlobalStyle } from "styled-components"
import reset from "styled-reset"

const GlobalStyles = createGlobalStyle`
  ${reset}

  body {
    font-family: 'Inter', 'Noto Sans KR', sans-serif;
    font-weight: 200;
    background: ${props => props.theme.colors.bodyBackground};
  }
`

export default GlobalStyles
