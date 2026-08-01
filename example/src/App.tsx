import React, { useState, useEffect } from "react";

// import component
import { IndicTransliterate, getTransliterationLanguages } from "@ai4bharat/indic-transliterate";

// Material Ui input component
import Input from "@material-ui/core/Input";
import { LangObject } from "../../dist/types";

const App = () => {
  const [text, setText] = useState("");
  const [languages, setLanguages] = useState<LangObject[]|undefined>();
  const [lang, setLang] = useState("hi");

  useEffect(() => {
    getTransliterationLanguages().then(langs => setLanguages(langs));
  }, [])

  return (
    <div className="container">
      <h2>Indic transliterate</h2>

      <select
        className="language-dropdown"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {languages?.map((l) => (
          <option key={l.LangCode} value={l.LangCode}>
            {l.DisplayName}
          </option>
        ))}
      </select>

      <div className="spacer" />

      <label htmlFor="react-transliterate-input">Using input</label>
      <IndicTransliterate
        value={text}
        onChangeText={(text) => {
          setText(text);
        }}
        lang={lang}
        placeholder="Start typing here..."
        id="react-transliterate-input"
      />

      <div className="spacer" />

      <label htmlFor="react-transliterate-textarea">Using textarea</label>
      <IndicTransliterate
        renderComponent={(props) => <textarea {...props} />}
        value={text}
        onChangeText={(text) => {
          setText(text);
        }}
        lang={lang}
        placeholder="Start typing here..."
        id="react-transliterate-textarea"
      />

      <div className="spacer" />

      <label htmlFor="react-transliterate-material-ui-input">
        Using Material UI input
      </label>
      <IndicTransliterate
        renderComponent={(props) => {
          const inputRef = props.ref;

          delete props.ref;

          return <Input fullWidth {...props} inputRef={inputRef} />;
        }}
        value={text}
        onChangeText={(text) => {
          setText(text);
        }}
        lang={lang}
        placeholder="Start typing here..."
        id="react-transliterate-material-ui-input"
      />
    </div>
  );
};

export default App;
