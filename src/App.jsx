import { useEffect, useState } from "react";
import "./App.css";

const creationModes = [
  {
    id: "photo",
    icon: "▧",
    label: "PHOTO",
    title: "写真から残す",
    description: "今日撮った一枚から、記憶をひらく",
  },
  {
    id: "draw",
    icon: "✎",
    label: "HANDWRITE",
    title: "手書きで残す",
    description: "言葉にならない気持ちも、そのまま",
  },
  {
    id: "text",
    icon: "Aa",
    label: "WORDS",
    title: "文章で残す",
    description: "今日の出来事や気持ちを、ゆっくり書く",
  },
  {
    id: "collage",
    icon: "◇",
    label: "COLLAGE",
    title: "自由にコラージュ",
    description: "写真・文字・手書きを一枚にまとめる",
  },
];

const writingPrompts = [
  "今日いちばん心に残っていることは？",
  "今日、少しだけ嬉しかったことは？",
  "今の自分にかけてあげたい言葉は？",
  "今日の景色をひとつ残すなら？",
  "明日の自分に伝えたいことは？",
];

const moods = [
  { id: "happy", icon: "☺", label: "うれしい" },
  { id: "calm", icon: "☁", label: "穏やか" },
  { id: "love", icon: "♡", label: "満たされた" },
  { id: "tired", icon: "☾", label: "疲れた" },
  { id: "sad", icon: "◌", label: "少し沈んだ" },
];

function App() {
  const [screen, setScreen] = useState("home");
  const [selectedMode, setSelectedMode] = useState("text");
  const [selectedMood, setSelectedMood] = useState("calm");
  const [promptIndex, setPromptIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedEntries = localStorage.getItem("moodbook-entries");

    if (!savedEntries) return;

    try {
      setEntries(JSON.parse(savedEntries));
    } catch {
      setEntries([]);
    }
  }, []);

  const todayJapanese = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const todayEnglish = new Date()
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

  function openEditor(modeId) {
    setSelectedMode(modeId);
    setScreen("editor");
    setMessage("");
  }

  function changePrompt() {
    setPromptIndex((current) => (current + 1) % writingPrompts.length);
  }

  function saveEntry() {
    if (!title.trim() && !text.trim()) {
      setMessage("タイトルか本文を少しだけ書いてみてね");
      return;
    }

    const newEntry = {
      id: Date.now(),
      title: title.trim() || "今日の記録",
      text: text.trim(),
      mood: selectedMood,
      mode: selectedMode,
      date: todayJapanese,
    };

    const updatedEntries = [newEntry, ...entries];

    setEntries(updatedEntries);
    localStorage.setItem(
      "moodbook-entries",
      JSON.stringify(updatedEntries),
    );

    setTitle("");
    setText("");
    setMessage("");
    setScreen("home");
  }

  if (screen === "editor") {
    return (
      <main className="app">
        <section className="editor-screen">
          <header className="editor-header">
            <button
              className="back-button"
              type="button"
              onClick={() => setScreen("home")}
            >
              ←
            </button>

            <div className="editor-date">
              <span>{todayEnglish}</span>
              <p>{todayJapanese}</p>
            </div>

            <button
              className="save-button"
              type="button"
              onClick={saveEntry}
            >
              保存
            </button>
          </header>

          <section className="paper-page">
            <div className="paper-decoration">
              <span>MY MOOD TODAY</span>
            </div>

            <div className="mood-selector">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  className={
                    selectedMood === mood.id
                      ? "mood-button selected"
                      : "mood-button"
                  }
                  type="button"
                  onClick={() => setSelectedMood(mood.id)}
                >
                  <span>{mood.icon}</span>
                  <small>{mood.label}</small>
                </button>
              ))}
            </div>

            <div className="prompt-card">
              <span>今日のきっかけ</span>
              <p>{writingPrompts[promptIndex]}</p>

              <button type="button" onClick={changePrompt}>
                別の質問を見る
              </button>
            </div>

            <input
              className="title-input"
              type="text"
              placeholder="今日のページに名前をつける"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <textarea
              className="diary-input"
              placeholder="上手に書かなくて大丈夫。今の気持ちを、そのまま。"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />

            <div className="editor-tools">
              <button
                className={selectedMode === "text" ? "active" : ""}
                type="button"
                onClick={() => setSelectedMode("text")}
              >
                Aa
                <span>文字</span>
              </button>

              <button
                className={selectedMode === "draw" ? "active" : ""}
                type="button"
                onClick={() => setSelectedMode("draw")}
              >
                ✎
                <span>手書き</span>
              </button>

              <button
                className={selectedMode === "photo" ? "active" : ""}
                type="button"
                onClick={() => setSelectedMode("photo")}
              >
                ▧
                <span>写真</span>
              </button>

              <button
                className={selectedMode === "collage" ? "active" : ""}
                type="button"
                onClick={() => setSelectedMode("collage")}
              >
                ◇
                <span>コラージュ</span>
              </button>
            </div>

            {message && <p className="form-message">{message}</p>}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className="home-screen">
        <header className="home-header">
          <div className="brand">
            <span className="brand-mark">M</span>

            <div>
              <p>PRIVATE DIGITAL JOURNAL</p>
              <h1>Moodbook</h1>
            </div>
          </div>

          <button
            className="archive-button"
            type="button"
            aria-label="日記一覧"
          >
            {entries.length}
            <span>pages</span>
          </button>
        </header>

        <section className="welcome-section">
          <div className="welcome-copy">
            <p className="today-label">{todayEnglish}</p>

            <h2>
              今日は、
              <br />
              どんな一日だった？
            </h2>

            <p className="welcome-text">
              写真一枚でも、ひとことでも大丈夫。
              <br />
              今の気持ちを、今日だけのページに。
            </p>
          </div>

          <div className="today-note">
            <span>TODAY’S NOTE</span>
            <p>{writingPrompts[promptIndex]}</p>

            <button type="button" onClick={changePrompt}>
              質問を変える
            </button>
          </div>
        </section>

        <section className="create-section">
          <div className="section-heading">
            <div>
              <span>CREATE A PAGE</span>
              <h3>今日は、どうやって残す？</h3>
            </div>

            <p>正解はないから、今の気分で選んでね。</p>
          </div>

          <div className="creation-grid">
            {creationModes.map((mode, index) => (
              <button
                key={mode.id}
                className={`creation-card creation-card-${index + 1}`}
                type="button"
                onClick={() => openEditor(mode.id)}
              >
                <span className="card-number">0{index + 1}</span>
                <span className="card-icon">{mode.icon}</span>
                <small>{mode.label}</small>
                <strong>{mode.title}</strong>
                <p>{mode.description}</p>
                <span className="card-arrow">→</span>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
