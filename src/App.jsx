import { useEffect, useRef, useState } from "react";
import "./App.css";

const MAX_PHOTOS = 5;

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

function normalizeEntry(entry) {
  const oldPhoto =
    typeof entry?.photo === "string" ? entry.photo : null;

  const photos = Array.isArray(entry?.photos)
    ? entry.photos.filter(Boolean)
    : oldPhoto
      ? [oldPhoto]
      : [];

  return {
    ...entry,
    photos,
  };
}

function App() {
  const [screen, setScreen] = useState("home");
  const [selectedMode, setSelectedMode] = useState("text");
  const [selectedMood, setSelectedMood] = useState("calm");
  const [promptIndex, setPromptIndex] = useState(0);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedFont, setSelectedFont] = useState("serif");
  const [photos, setPhotos] = useState([]);
  const [openPhoto, setOpenPhoto] = useState(null);
  const [drawingData, setDrawingData] = useState("");
  const [selectedColor, setSelectedColor] = useState("black");
  const [brushSize, setBrushSize] = useState("medium");
  const [drawingTool, setDrawingTool] = useState("pen");
  const drawingCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const undoStackRef = useRef([]);
  const canvasDimensionsRef = useRef({ width: 0, height: 0 });

  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);

  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(),
  );
  const [selectedCalendarDate, setSelectedCalendarDate] =
    useState(null);

  const [message, setMessage] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedEntries = localStorage.getItem("moodbook-entries");

    if (!savedEntries) return;

    try {
      const parsedEntries = JSON.parse(savedEntries);

      setEntries(
        Array.isArray(parsedEntries)
          ? parsedEntries.map(normalizeEntry)
          : [],
      );
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

  function resetEditor() {
    setTitle("");
    setText("");
    setPhotos([]);
    setOpenPhoto(null);
    setSelectedMood("calm");
    setSelectedMode("text");
    setDrawingData("");
    setSelectedColor("black");
    setBrushSize("medium");
    setDrawingTool("pen");
    setEditingEntryId(null);
    setMessage("");
    undoStackRef.current = [];

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openEditor(modeId) {
    resetEditor();
    setSelectedEntry(null);
    setSelectedMode(modeId);
    setScreen("editor");
  }

  function closeEditor() {
    const wasEditing =
      editingEntryId !== null && selectedEntry !== null;

    resetEditor();
    setScreen(wasEditing ? "detail" : "home");
  }

  function editSelectedEntry() {
    if (!selectedEntry) return;

    const normalizedEntry = normalizeEntry(selectedEntry);

    setEditingEntryId(normalizedEntry.id);
    setTitle(normalizedEntry.title || "");
    setText(normalizedEntry.text || "");
    setPhotos(normalizedEntry.photos.slice(0, MAX_PHOTOS));
    setSelectedMood(normalizedEntry.mood || "calm");
    setSelectedMode(normalizedEntry.mode || "text");
    setDrawingData(normalizedEntry.drawing || "");
    setDrawingTool("pen");
    setSelectedColor("black");
    setBrushSize("medium");
    setMessage("");
    setScreen("editor");
  }

  function changePrompt() {
    setPromptIndex(
      (current) => (current + 1) % writingPrompts.length,
    );
  }

  function persistEntries(updatedEntries) {
    try {
      localStorage.setItem(
        "moodbook-entries",
        JSON.stringify(updatedEntries),
      );

      return true;
    } catch (error) {
      console.error(error);

      setMessage(
        "写真の保存容量を超えました。写真を減らすか、保存先をクラウドへ移行してください。",
      );

      return false;
    }
  }

  const getBrushColor = () => {
    if (drawingTool === "eraser") {
      return "rgba(0,0,0,1)";
    }

    if (selectedColor === "brown") {
      return "#7f5b4d";
    }

    if (selectedColor === "pink") {
      return "#cd8b95";
    }

    return "#2c2420";
  };

  const getBrushWidth = () => {
    if (brushSize === "thin") {
      return 2.5;
    }

    if (brushSize === "thick") {
      return 10;
    }

    return 6;
  };

  const getCompositeOperation = () =>
    drawingTool === "eraser"
      ? "destination-out"
      : "source-over";

  const updateDrawingData = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    setDrawingData(dataUrl);
  };

  const loadCanvasFromData = (dataUrl) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || !dataUrl) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    image.onload = () => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      context.drawImage(
        image,
        0,
        0,
        rect.width,
        rect.height,
      );
    };
    image.src = dataUrl;
  };

  const resizeCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (
      canvasDimensionsRef.current.width === width &&
      canvasDimensionsRef.current.height === height
    ) {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    if (drawingData) {
      loadCanvasFromData(drawingData);
    }

    canvasDimensionsRef.current = { width, height };
  };

  const beginStroke = (event) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;

    undoStackRef.current.push(
      canvas.toDataURL("image/png"),
    );
    if (undoStackRef.current.length > 40) {
      undoStackRef.current.shift();
    }

    lastPointerRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    context.beginPath();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = getBrushColor();
    context.lineWidth = getBrushWidth();
    context.globalCompositeOperation = getCompositeOperation();
    context.moveTo(
      lastPointerRef.current.x,
      lastPointerRef.current.y,
    );
  };

  const continueStroke = (event) => {
    if (!isDrawingRef.current) return;

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;

    event.preventDefault();

    const nextX = event.clientX - rect.left;
    const nextY = event.clientY - rect.top;

    context.lineTo(nextX, nextY);
    context.stroke();

    lastPointerRef.current = {
      x: nextX,
      y: nextY,
    };
  };

  const endStroke = (event) => {
    if (!isDrawingRef.current) return;

    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.closePath();
      }
    }

    isDrawingRef.current = false;
    updateDrawingData();

    if (event?.target?.releasePointerCapture) {
      event.target.releasePointerCapture(event.pointerId);
    }
  };

  const undoDrawing = () => {
    const previousState = undoStackRef.current.pop();
    if (!previousState) return;

    loadCanvasFromData(previousState);
    setDrawingData(previousState);
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;

    undoStackRef.current.push(
      canvas.toDataURL("image/png"),
    );
    if (undoStackRef.current.length > 40) {
      undoStackRef.current.shift();
    }

    context.clearRect(0, 0, rect.width, rect.height);
    setDrawingData("");
  };

  useEffect(() => {
    if (editingEntryId !== null && selectedEntry) {
      setDrawingData(selectedEntry.drawing || "");
    }
  }, [editingEntryId, selectedEntry]);

  useEffect(() => {
    if (screen !== "editor" || selectedMode !== "draw") {
      return undefined;
    }

    const canvas = drawingCanvasRef.current;
    if (!canvas) return undefined;

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [screen, selectedMode, drawingData]);

  function saveEntry() {
    if (
      !title.trim() &&
      !text.trim() &&
      photos.length === 0 &&
      !drawingData
    ) {
      setMessage(
        "タイトル・本文・写真・手書きのどれかを追加してみてね",
      );
      return;
    }

    if (editingEntryId !== null) {
      const updatedEntry = normalizeEntry({
        ...selectedEntry,
        title: title.trim() || "今日の記録",
        text: text.trim(),
        photos,
        mood: selectedMood,
        mode: selectedMode,
        drawing: drawingData || selectedEntry?.drawing || "",
      });

      const updatedEntries = entries.map((entry) =>
        entry.id === editingEntryId
          ? updatedEntry
          : normalizeEntry(entry),
      );

      if (!persistEntries(updatedEntries)) return;

      setEntries(updatedEntries);
      setSelectedEntry(updatedEntry);
      resetEditor();
      setScreen("detail");
      return;
    }

    const newEntry = {
      id: Date.now(),
      title: title.trim() || "今日の記録",
      text: text.trim(),
      photos,
      mood: selectedMood,
      mode: selectedMode,
      date: todayJapanese,
      drawing: drawingData,
    };

    const updatedEntries = [
      newEntry,
      ...entries.map(normalizeEntry),
    ];

    if (!persistEntries(updatedEntries)) return;

    setEntries(updatedEntries);
    resetEditor();
    setScreen("home");
  }

  function removePhoto(indexToRemove) {
    setPhotos((currentPhotos) =>
      currentPhotos.filter(
        (_, index) => index !== indexToRemove,
      ),
    );
  }

  function compressPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => {
        reject(new Error("写真を読み込めませんでした"));
      };

      reader.onload = () => {
        const image = new Image();

        image.onerror = () => {
          reject(new Error("写真を処理できませんでした"));
        };

        image.onload = () => {
          const maxSize = 1200;

          let width = image.width;
          let height = image.height;

          if (width > height && width > maxSize) {
            height = Math.round(
              (height * maxSize) / width,
            );
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round(
              (width * maxSize) / height,
            );
            height = maxSize;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("写真を処理できませんでした"));
            return;
          }

          context.drawImage(
            image,
            0,
            0,
            width,
            height,
          );

          resolve(
            canvas.toDataURL("image/jpeg", 0.7),
          );
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoSelection(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const remainingSlots =
      MAX_PHOTOS - photos.length;

    if (remainingSlots <= 0) {
      setMessage(
        `写真は1ページにつき最大${MAX_PHOTOS}枚です`,
      );

      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(
      0,
      remainingSlots,
    );

    if (files.length > remainingSlots) {
      setMessage(
        `写真は1ページにつき最大${MAX_PHOTOS}枚です`,
      );
    } else {
      setMessage("");
    }

    try {
      const compressedPhotos =
        await Promise.all(
          selectedFiles.map((file) =>
            compressPhoto(file),
          ),
        );

      setPhotos((currentPhotos) =>
        [
          ...currentPhotos,
          ...compressedPhotos,
        ].slice(0, MAX_PHOTOS),
      );
    } catch (error) {
      console.error(error);
      setMessage("写真の処理に失敗しました");
    } finally {
      event.target.value = "";
    }
  }

  if (screen === "detail" && selectedEntry) {
    const normalizedEntry =
      normalizeEntry(selectedEntry);

    const detailMood = moods.find(
      (mood) =>
        mood.id === normalizedEntry.mood,
    );

    return (
      <main className="app">
        <section className="detail-screen">
          <header className="detail-header">
            <button
              className="back-button"
              type="button"
              onClick={() => setScreen("archive")}
            >
              ←
            </button>

            <div>
              <p>PRIVATE PAGE</p>
              <span>{normalizedEntry.date}</span>
            </div>

            <span className="detail-mood">
              {detailMood?.icon || "◌"}
            </span>
          </header>

          <article className="detail-page">
            <p className="detail-label">
              MY MOOD TODAY
            </p>

            <h1>{normalizedEntry.title}</h1>

            <p className="detail-text">
              {normalizedEntry.text ||
                "本文はありません"}
            </p>

            {normalizedEntry.drawing ? (
              <div className="detail-drawing">
                <img
                  src={normalizedEntry.drawing}
                  alt="手書きのメモ"
                />
              </div>
            ) : null}

            {normalizedEntry.photos.length >
              0 && (
              <>
                <div className="detail-photo-status">
                  <span>PHOTO</span>

                  <span className="detail-photo-status-dot">
                    ·
                  </span>

                  <span>
                    {String(
                      normalizedEntry.photos.length,
                    ).padStart(2, "0")}
                  </span>
                </div>

                <div className="detail-photo-grid">
                  {normalizedEntry.photos.map(
                    (photoItem, index) => (
                      <button
                        className="detail-photo-item"
                        type="button"
                        key={`${normalizedEntry.id}-photo-${index}`}
                        onClick={() =>
                          setOpenPhoto(photoItem)
                        }
                      >
                        <img
                          src={photoItem}
                          alt={`保存した写真 ${
                            index + 1
                          }`}
                        />
                      </button>
                    ),
                  )}
                </div>
              </>
            )}

            <button
              className="edit-entry-button"
              type="button"
              onClick={editSelectedEntry}
            >
              このページを編集
            </button>
          </article>

          {openPhoto && (
            <div
              className="photo-modal"
              onClick={() =>
                setOpenPhoto(null)
              }
            >
              <button
                type="button"
                className="photo-modal-close"
                onClick={() =>
                  setOpenPhoto(null)
                }
                aria-label="拡大写真を閉じる"
              >
                ×
              </button>

              <img
                src={openPhoto}
                alt="写真を拡大表示"
                onClick={(event) =>
                  event.stopPropagation()
                }
              />
            </div>
          )}
        </section>
      </main>
    );
  }

  if (screen === "archive") {
    const calendarYear =
      calendarMonth.getFullYear();

    const calendarMonthIndex =
      calendarMonth.getMonth();

    const firstWeekday = new Date(
      calendarYear,
      calendarMonthIndex,
      1,
    ).getDay();

    const daysInMonth = new Date(
      calendarYear,
      calendarMonthIndex + 1,
      0,
    ).getDate();

    const calendarCellCount =
      Math.ceil(
        (firstWeekday + daysInMonth) / 7,
      ) * 7;

    const calendarDays = Array.from(
      { length: calendarCellCount },
      (_, index) => {
        const day =
          index - firstWeekday + 1;

        return day >= 1 &&
          day <= daysInMonth
          ? day
          : null;
      },
    );

    const calendarTitle =
      `${calendarYear}年` +
      `${calendarMonthIndex + 1}月`;

    function getEntryDateKey(entry) {
      const match = String(
        entry.date || "",
      ).match(
        /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      );

      if (!match) return "";

      return (
        `${match[1]}-` +
        `${match[2].padStart(2, "0")}-` +
        `${match[3].padStart(2, "0")}`
      );
    }

    return (
      <main className="app">
        <section className="archive-screen">
          <header className="archive-header">
            <button
              className="back-button"
              type="button"
              onClick={() => setScreen("home")}
            >
              ←
            </button>

            <div>
              <p>PRIVATE ARCHIVE</p>
              <h1>My pages</h1>
            </div>

            <span className="archive-count">
              {entries.length}
            </span>
          </header>

          <section className="calendar-panel">
            <div className="calendar-toolbar">
              <button
                type="button"
                className="calendar-month-button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarYear,
                      calendarMonthIndex - 1,
                      1,
                    ),
                  )
                }
              >
                ‹
              </button>

              <h2>{calendarTitle}</h2>

              <button
                type="button"
                className="calendar-month-button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarYear,
                      calendarMonthIndex + 1,
                      1,
                    ),
                  )
                }
              >
                ›
              </button>
            </div>

            <div className="calendar-weekdays">
              {[
                "日",
                "月",
                "火",
                "水",
                "木",
                "金",
                "土",
              ].map((weekday) => (
                <span key={weekday}>
                  {weekday}
                </span>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map(
                (day, index) => {
                  if (day === null) {
                    return (
                      <div
                        className="calendar-cell calendar-cell-empty"
                        key={`empty-${index}`}
                      />
                    );
                  }

                  const dateKey =
                    `${calendarYear}-` +
                    `${String(
                      calendarMonthIndex + 1,
                    ).padStart(2, "0")}-` +
                    `${String(day).padStart(
                      2,
                      "0",
                    )}`;

                  const dayEntries =
                    entries.filter(
                      (entry) =>
                        getEntryDateKey(
                          entry,
                        ) === dateKey,
                    );

                  const isSelected =
                    selectedCalendarDate ===
                    dateKey;

                  return (
                    <button
                      type="button"
                      className={`calendar-cell${
                        isSelected
                          ? " calendar-cell-selected"
                          : ""
                      }`}
                      key={dateKey}
                      onClick={() => {
                        setSelectedCalendarDate(
                          dateKey,
                        );

                        if (
                          dayEntries.length > 0
                        ) {
                          setSelectedEntry(
                            normalizeEntry(
                              dayEntries[0],
                            ),
                          );

                          setScreen("detail");
                        }
                      }}
                    >
                      <span className="calendar-day-number">
                        {day}
                      </span>

                      {dayEntries.length >
                        0 && (
                        <span className="calendar-entry-count">
                          {dayEntries.length}
                        </span>
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </section>

          {entries.length === 0 ? (
            <div className="archive-empty">
              <span>◇</span>
              <h2>
                まだページがありません
              </h2>

              <p>
                今日の気持ちを、最初の1ページに残してみよう。
              </p>

              <button
                type="button"
                onClick={() =>
                  setScreen("home")
                }
              >
                ページを作る
              </button>
            </div>
          ) : (
            <div className="archive-grid">
              {entries.map((entry) => {
                const normalizedEntry =
                  normalizeEntry(entry);

                const entryMood =
                  moods.find(
                    (mood) =>
                      mood.id ===
                      normalizedEntry.mood,
                  );

                return (
                  <article
                    className="archive-card"
                    key={normalizedEntry.id}
                    onClick={() => {
                      setSelectedEntry(
                        normalizedEntry,
                      );
                      setScreen("detail");
                    }}
                  >
                    <div className="archive-card-top">
                      <span>
                        {entryMood?.icon ||
                          "◌"}
                      </span>

                      <small>
                        {normalizedEntry.date}
                      </small>
                    </div>

                    <h2>
                      {normalizedEntry.title}
                    </h2>

                    <p>
                      {normalizedEntry.text ||
                        "本文はありません"}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    );
  }

  if (screen === "editor") {
    return (
      <main className="app">
        <section className="editor-screen">
          <header className="editor-header">
            <button
              className="back-button"
              type="button"
              onClick={closeEditor}
            >
              ←
            </button>

            <div className="editor-date">
              <span>
                {editingEntryId !== null
                  ? "EDITING PAGE"
                  : todayEnglish}
              </span>

              <p>
                {editingEntryId !== null
                  ? selectedEntry?.date ||
                    todayJapanese
                  : todayJapanese}
              </p>
            </div>

            <button
              className="save-button"
              type="button"
              onClick={saveEntry}
            >
              {editingEntryId !== null
                ? "更新"
                : "保存"}
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
                  onClick={() =>
                    setSelectedMood(mood.id)
                  }
                >
                  <span>{mood.icon}</span>
                  <small>{mood.label}</small>
                </button>
              ))}
            </div>

            <div className="prompt-card">
              <span>今日のきっかけ</span>
              <p>
                {writingPrompts[promptIndex]}
              </p>

              <button
                type="button"
                onClick={changePrompt}
              >
                別の質問を見る
              </button>
            </div>

            <input
              className="title-input"
              type="text"
              placeholder="今日のページに名前をつける"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handlePhotoSelection}
            />

            {photos.length > 0 && (
              <div className="photo-preview-grid">
                {photos.map(
                  (photoItem, index) => (
                    <div
                      className="photo-preview-wrap"
                      key={`draft-photo-${index}`}
                    >
                      <button
                        type="button"
                        className="photo-preview"
                        onClick={() =>
                          setOpenPhoto(
                            photoItem,
                          )
                        }
                      >
                        <img
                          src={photoItem}
                          alt={`選択した写真 ${
                            index + 1
                          }`}
                        />

                        <span
                          className="photo-zoom-icon"
                          aria-hidden="true"
                        >
                          +
                        </span>
                      </button>

                      <button
                        className="photo-remove-button"
                        type="button"
                        onClick={() =>
                          removePhoto(index)
                        }
                        aria-label={`写真 ${
                          index + 1
                        } を削除`}
                      >
                        ×
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
            {selectedMode === "draw" && (
              <div className="drawing-panel">
                <div className="drawing-toolbar">
                  <div className="drawing-tools-row">
                    <button
                      type="button"
                      className={
                        drawingTool === "pen"
                          ? "drawing-tool-button active"
                          : "drawing-tool-button"
                      }
                      onClick={() => setDrawingTool("pen")}
                    >
                      ペン
                    </button>

                    <button
                      type="button"
                      className={
                        drawingTool === "eraser"
                          ? "drawing-tool-button active"
                          : "drawing-tool-button"
                      }
                      onClick={() => setDrawingTool("eraser")}
                    >
                      消しゴム
                    </button>
                  </div>

                  <div className="drawing-toolbar-row">
                    <div className="drawing-color-row">
                      {[
                        { id: "black", label: "黒", color: "#2c2420" },
                        { id: "brown", label: "ブラウン", color: "#7f5b4d" },
                        { id: "pink", label: "ピンク", color: "#cd8b95" },
                      ].map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          className={
                            selectedColor === color.id &&
                            drawingTool === "pen"
                              ? "drawing-color-button active"
                              : "drawing-color-button"
                          }
                          onClick={() => {
                            setSelectedColor(color.id);
                            setDrawingTool("pen");
                          }}
                          disabled={drawingTool === "eraser"}
                          aria-label={`${color.label} のペン色`}
                        >
                          <span
                            className="color-chip"
                            style={{ background: color.color }}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="drawing-size-row">
                      {[
                        { id: "thin", label: "細", width: 2.5 },
                        { id: "medium", label: "中", width: 6 },
                        { id: "thick", label: "太", width: 10 },
                      ].map((size) => (
                        <button
                          key={size.id}
                          type="button"
                          className={
                            brushSize === size.id
                              ? "drawing-size-button active"
                              : "drawing-size-button"
                          }
                          onClick={() => setBrushSize(size.id)}
                          aria-label={`${size.label} の線幅`}
                        >
                          <span
                            className="size-preview"
                            style={{ height: `${size.width}px` }}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="drawing-action-row">
                      <button
                        type="button"
                        className="drawing-action-button small"
                        onClick={undoDrawing}
                        disabled={undoStackRef.current.length === 0}
                        aria-label="戻る"
                      >
                        ↶
                      </button>
                      <button
                        type="button"
                        className="drawing-action-button small"
                        onClick={() => setDrawingTool("eraser")}
                        aria-label="消しゴムに切り替え"
                      >
                        🩹
                      </button>
                      <button
                        type="button"
                        className="drawing-action-button small danger"
                        onClick={clearDrawing}
                        aria-label="全消去"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>

                <div className="drawing-area">
                  <canvas
                    ref={drawingCanvasRef}
                    className="drawing-canvas"
                    onPointerDown={beginStroke}
                    onPointerMove={continueStroke}
                    onPointerUp={endStroke}
                    onPointerLeave={endStroke}
                    onPointerCancel={endStroke}
                  />
                </div>
              </div>
            )}
            <textarea
              className={"diary-input " + selectedFont}
              placeholder="上手に書かなくて大丈夫。今の気持ちを、そのまま。"
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
            />

            <div className="editor-tools">
              <div className="font-selector">
  <button
    className={selectedFont === "serif" ? "active" : ""}
    onClick={() => setSelectedFont("serif")}
  >
    明朝
  </button>

  <button
    className={selectedFont === "sans" ? "active" : ""}
    onClick={() => setSelectedFont("sans")}
  >
    ゴシック
  </button>

  <button
    className={selectedFont === "hand" ? "active" : ""}
    onClick={() => setSelectedFont("hand")}
  >
    ペン字
  </button>
</div>
              <button
                className={
                  selectedMode === "text"
                    ? "active"
                    : ""
                }
                type="button"
                onClick={() =>
                  setSelectedMode("text")
                }
              >
                Aa
                <span>文字</span>
              </button>

              <button
                className={
                  selectedMode === "draw"
                    ? "active"
                    : ""
                }
                type="button"
                onClick={() =>
                  setSelectedMode("draw")
                }
              >
                ✎
                <span>手書き</span>
              </button>

              <button
                className={
                  selectedMode === "photo"
                    ? "active"
                    : ""
                }
                type="button"
                onClick={() => {
                  setSelectedMode("photo");
                  fileInputRef.current?.click();
                }}
              >
                ▧

                <span>
                  写真 {photos.length}/
                  {MAX_PHOTOS}
                </span>
              </button>

              <button
                className={
                  selectedMode === "collage"
                    ? "active"
                    : ""
                }
                type="button"
                onClick={() =>
                  setSelectedMode("collage")
                }
              >
                ◇
                <span>コラージュ</span>
              </button>
            </div>

            {message && (
              <p className="form-message">
                {message}
              </p>
            )}
          </section>

          {openPhoto && (
            <div
              className="photo-modal"
              onClick={() =>
                setOpenPhoto(null)
              }
            >
              <button
                type="button"
                className="photo-modal-close"
                onClick={() =>
                  setOpenPhoto(null)
                }
                aria-label="拡大写真を閉じる"
              >
                ×
              </button>

              <img
                src={openPhoto}
                alt="選択した写真を拡大表示"
                onClick={(event) =>
                  event.stopPropagation()
                }
              />
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className="home-screen">
        <header className="home-header">
          <div className="brand">
            <span className="brand-mark">
              M
            </span>

            <div>
              <p>
                PRIVATE DIGITAL JOURNAL
              </p>
              <h1>Moodbook</h1>
            </div>
          </div>

          <button
            className="archive-button"
            type="button"
            aria-label="日記一覧"
            onClick={() =>
              setScreen("archive")
            }
          >
            {entries.length}
            <span>pages</span>
          </button>
        </header>

        <section className="welcome-section">
          <div className="welcome-copy">
            <p className="today-label">
              {todayEnglish}
            </p>

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

            <p>
              {writingPrompts[promptIndex]}
            </p>

            <button type="button" onClick={changePrompt}>
              質問を変える
            </button>
          </div>
        </section>

        <section className="create-section">
          <div className="section-heading">
            <div>
              <span>CREATE A PAGE</span>

              <h3>
                今日は、どうやって残す？
              </h3>
            </div>

            <p>
              正解はないから、今の気分で選んでね。
            </p>
          </div>

          <div className="creation-grid">
            {creationModes.map(
              (mode, index) => (
                <button
                  key={mode.id}
                  className={`creation-card creation-card-${
                    index + 1
                  }`}
                  type="button"
                  onClick={() =>
                    openEditor(mode.id)
                  }
                >
                  <span className="card-number">
                    0{index + 1}
                  </span>

                  <span className="card-icon">
                    {mode.icon}
                  </span>

                  <small>{mode.label}</small>
                  <strong>{mode.title}</strong>
                  <p>{mode.description}</p>

                  <span className="card-arrow">
                    →
                  </span>
                </button>
              ),
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
