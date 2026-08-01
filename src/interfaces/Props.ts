import { Language } from "../types/Language";

export interface IndicTransliterateProps
  extends React.HTMLProps<HTMLInputElement | HTMLTextAreaElement> {
  /**
   * Component to render. You can pass components from your
   * component library as this prop. Default is `<input />`
   * @type React.ReactNode
   */
  renderComponent?: (props: any) => React.ReactNode;

  /**
   * Extra space between the caret and left of the helper
   * @type number
   */
  offsetX?: number;

  /**
   * Extra space between the top of the helper and bottom of the caret
   * @type number
   */
  offsetY?: number;

  /**
   * Classname passed to the container of the component
   */
  containerClassName?: string;

  /**
   * CSS styles object passed to the container
   */
  containerStyles?: React.CSSProperties;

  /**
   * CSS styles object passed to the active item `<li>` tag
   */
  activeItemStyles?: React.CSSProperties;

  /**
   * Maximum number of suggestions to show in helper
   */
  maxOptions?: number;

  /**
   * Language you want to transliterate. See the README for language codes
   */
  lang?: Language;

  /**
   * Listener for the current value from the component. `(text: string) => void`
   */
  onChangeText: (text: string) => void;

  /**
   * `value` prop to pass to the component
   */
  value: string;

  /**
   * Should the suggestions be visible on mobile devices since
   * keyboards like Gboard and Swiftkey support typing in multiple languages
   * @type boolean
   */
  hideSuggestionBoxOnMobileDevices?: boolean;

  /**
   * To be used when `hideSuggestionBoxOnMobileDevices` is true.
   * Suggestion box will not be shown below this device width
   * @type number
   */
  hideSuggestionBoxBreakpoint?: number;

  /**
   * Keys which when pressed, input the current selection to the textbox
   */
  triggerKeys?: string[];

  /**
   * Should the current selection be inserted when `blur` event occurs
   * @type boolean
   */
  insertCurrentSelectionOnBlur?: boolean;

  /**
   * Show current input as the last option in the suggestion box
   * @type boolean
   */
  showCurrentWordAsLastSuggestion?: boolean;

  /**
   * Control whether suggestions should be shown
   * @type boolean
   */
  enabled?: boolean;

  /**
   * Control whether suggestions should be shown in horizontal direction
   * @type boolean
   */
  horizontalView?: boolean;

  customApiURL?: string;

  apiKey?: string;

  /**
   * Milliseconds of keystroke idle to wait before calling the transliterate API.
   * Reduces request volume on fast typing. Default 500.
   */
  debounceMs?: number;

  /**
   * Fired every time the user commits a transliterated word (via trigger key,
   * click, or blur-insert). Used by the personalization layer to record the
   * (preceding-context, committed-word) pair into the user's writing history.
   */
  onWordCommit?: (info: {
    precedingText: string;
    committedWord: string;
    lang: string;
  }) => void;
}