var React = b;
var ReactDOM = bc;
var jsx = g;
var jsxs = E;

function getNode(tree, path) {
  if (path === "/" || path === "") return tree;
  let node = tree;
  for (const part of path.split("/").filter(Boolean)) {
    if (node.type !== "dir") return null;
    if (!(part in node.children)) return null;
    node = node.children[part];
  }
  return node;
}

function cloneFs(node) {
  const children = {};
  for (const [name, child] of Object.entries(node.children)) {
    children[name] = child.type === "dir" ? cloneFs(child) : { ...child };
  }
  return { type: "dir", children };
}

function App() {
  const [step, setStep] = React.useState(0);
  const [committedCategory, setCommittedCategory] = React.useState(null);
  const [committedAction, setCommittedAction] = React.useState(null);
  const [previewCategory, setPreviewCategory] = React.useState(null);
  const [previewAction, setPreviewAction] = React.useState(null);
  const [arg, setArg] = React.useState("");
  const [cwd, setCwd] = React.useState("/");
  const [fs, setFs] = React.useState(() => cloneFs(D0));
  const [history, setHistory] = React.useState([]);
  const [flash, setFlash] = React.useState(null);
  const shellRef = React.useRef(null);
  const cwdNode = React.useMemo(() => getNode(fs, cwd), [fs, cwd]);
  const items = React.useMemo(() => {
    if (!cwdNode || cwdNode.type !== "dir") return [];
    return Object.entries(cwdNode.children).map(([name, node]) => ({
      name,
      type: node.type,
    }));
  }, [cwdNode]);

  React.useEffect(() => {
    shellRef.current?.focus();
  }, []);

  const runCommand = (category, action, rawArg) => {
    const id = Math.random().toString(36).slice(2, 8);
    const ts = new Date().toLocaleTimeString([], { hour12: false });
    let output = { type: "text", data: "" };
    let nextFs = fs;
    let nextCwd = cwd;

    if (category === "d") {
      if (action === "l") {
        const dir = getNode(nextFs, nextCwd);
        output = {
          type: "list",
          data: Object.entries(dir.children).map(([name, node]) => ({
            name,
            type: node.type,
          })),
        };
      } else if (action === "m") {
        const name = rawArg.trim();
        if (!name) {
          output = { type: "text", data: "error: folder name required" };
        } else {
          const dir = getNode(nextFs, nextCwd);
          if (name in dir.children) {
            output = { type: "text", data: `error: '${name}' already exists` };
          } else {
            nextFs = cloneFs(fs);
            getNode(nextFs, nextCwd).children[name] = { type: "dir", children: {} };
            setFs(nextFs);
            output = { type: "text", data: `created directory '${name}' at ${nextCwd}` };
          }
        }
      } else if (action === "c") {
        if (rawArg === ".." || rawArg === "../") {
          if (nextCwd !== "/") {
            const parts = nextCwd.split("/").filter(Boolean);
            parts.pop();
            nextCwd = "/" + parts.join("/");
            if (nextCwd === "") nextCwd = "/";
            setCwd(nextCwd);
            output = { type: "text", data: `changed to ${nextCwd}` };
          } else {
            output = { type: "text", data: "already at root" };
          }
        } else if (rawArg === "/" || rawArg === "") {
          nextCwd = "/";
          setCwd("/");
          output = { type: "text", data: "changed to /" };
        } else {
          const target = nextCwd === "/" ? `/${rawArg}` : `${nextCwd}/${rawArg}`;
          const dir = getNode(fs, target);
          if (dir && dir.type === "dir") {
            nextCwd = target;
            setCwd(target);
            output = { type: "text", data: `changed to ${target}` };
          } else {
            output = { type: "text", data: `error: directory '${rawArg}' not found` };
          }
        }
      } else if (action === "r") {
        const name = rawArg.trim();
        const dir = getNode(nextFs, nextCwd);
        if (!dir || !(name in dir.children) || dir.children[name].type !== "dir") {
          output = { type: "text", data: `error: folder '${name}' not found` };
        } else {
          nextFs = cloneFs(fs);
          delete getNode(nextFs, nextCwd).children[name];
          setFs(nextFs);
          output = { type: "text", data: `removed '${name}'` };
        }
      }
    } else if (category === "f") {
      if (action === "v" || action === "e") {
        const file = getNode(fs, cwd === "/" ? `/${rawArg}` : `${cwd}/${rawArg}`);
        if (!file || file.type !== "file") {
          output = { type: "text", data: `error: file '${rawArg}' not found` };
        } else {
          output = { type: "text", data: file.content || "(empty file)" };
        }
      } else if (action === "n") {
        const name = rawArg.trim();
        if (!name) {
          output = { type: "text", data: "error: filename required" };
        } else {
          nextFs = cloneFs(fs);
          getNode(nextFs, nextCwd).children[name] = { type: "file", content: "" };
          setFs(nextFs);
          output = { type: "text", data: `created file '${name}'` };
        }
      } else if (action === "d") {
        const dir = getNode(nextFs, nextCwd);
        if (!dir || !(rawArg in dir.children) || dir.children[rawArg].type !== "file") {
          output = { type: "text", data: `error: file '${rawArg}' not found` };
        } else {
          nextFs = cloneFs(fs);
          delete getNode(nextFs, nextCwd).children[rawArg];
          setFs(nextFs);
          output = { type: "text", data: `deleted file '${rawArg}'` };
        }
      }
    } else if (category === "s") {
      if (action === "i") {
        output = {
          type: "text",
          data: `system: path=${cwd} | items=${items.length} | history=${history.length}`,
        };
      } else if (action === "c") {
        output = { type: "text", data: "cleared history" };
        setHistory([
          {
            id,
            category,
            action,
            arg: rawArg,
            path: cwd,
            output,
            ts,
          },
        ]);
        setFlash("cleared");
        setTimeout(() => setFlash(null), 600);
        return;
      } else if (action === "h") {
        output = {
          type: "text",
          data: "help: d=directory f=file s=system h=help | space=commit esc=back",
        };
      }
    } else if (category === "h") {
      if (action === "l") {
        output = {
          type: "text",
          data: Object.entries(Z)
            .map(([key, cat]) => `${key} ${cat.label}: ${Object.keys(cat.actions).join(", ")}`)
            .join("\n"),
        };
      } else {
        output = {
          type: "text",
          data: "categories: [d] directory, [f] file, [s] system, [h] help",
        };
      }
    }

    const entry = {
      id,
      category,
      action,
      arg: rawArg,
      path: cwd,
      output,
      ts,
    };
    setHistory((entries) => [entry, ...entries].slice(0, 30));
    setFlash("ok");
    setTimeout(() => setFlash(null), 400);
  };

  const onKeyDown = (event) => {
    const key = event.key;
    if (key === " ") event.preventDefault();

    if (step === 0) {
      if (/^[a-zA-Z]$/.test(key)) {
        const letter = key.toLowerCase();
        if (letter in Z) {
          setCommittedCategory(letter);
          setPreviewCategory(null);
          setPreviewAction(null);
          setStep(1);
        }
      } else if (key === "Backspace" || key === "Delete") {
        setPreviewCategory(null);
      } else if (key === "Escape") {
        setPreviewCategory(null);
        setCommittedCategory(null);
        setCommittedAction(null);
        setArg("");
        setStep(0);
      }
    } else if (step === 1) {
      if (/^[a-zA-Z]$/.test(key)) {
        const letter = key.toLowerCase();
        if (committedCategory && letter in Z[committedCategory].actions) {
          setPreviewAction(letter);
        }
      } else if (key === "Backspace" || key === "Delete") {
        if (previewAction) setPreviewAction(null);
        else {
          setCommittedCategory(null);
          setStep(0);
        }
      } else if (key === "Escape") {
        if (previewAction) setPreviewAction(null);
        else {
          setCommittedCategory(null);
          setStep(0);
        }
      } else if (key === " ") {
        if (previewAction && committedCategory) {
          if (Z[committedCategory].actions[previewAction].needsArg) {
            setCommittedAction(previewAction);
            setPreviewAction(null);
            setStep(2);
          } else {
            runCommand(committedCategory, previewAction, "");
            setCommittedCategory(null);
            setCommittedAction(null);
            setPreviewAction(null);
            setStep(0);
            setArg("");
          }
        }
      }
    } else if (step === 2) {
      if (key === "Escape") {
        setArg("");
        setStep(1);
        setCommittedAction(null);
      } else if (key === "Backspace" || key === "Delete") {
        setArg((value) => value.slice(0, -1));
      } else if (key === " " || key === "Enter") {
        event.preventDefault();
        if (committedCategory && committedAction) {
          runCommand(committedCategory, committedAction, arg.trim());
          setCommittedCategory(null);
          setCommittedAction(null);
          setArg("");
          setStep(0);
        }
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey) {
        setArg((value) => value + key);
      }
    }
  };

  const focusedCategory = previewCategory
    ? Z[previewCategory]
    : committedCategory
      ? Z[committedCategory]
      : null;
  const menuCategory = step === 0 ? previewCategory : committedCategory;

  return jsxs("div", {
    ref: shellRef,
    tabIndex: 0,
    onKeyDown: onKeyDown,
    className:
      "app-shell h-full w-full bg-[#0b1220] text-[#0f172a] outline-none selection:bg-blue-200 flex justify-center overflow-hidden p-[12px] sm:p-[24px]",
    style: {
      paddingTop: "var(--safe-area-inset-top,0px)",
    },
    children: [
      jsxs("div", {
        className:
          "app-frame w-full max-w-[1280px] h-full max-h-full min-h-0 flex flex-col overflow-hidden rounded-[16px] border border-[#334155] bg-[#f8fafc] shadow-2xl",
        children: [
          jsxs("div", {
            className: "h-[40px] shrink-0 flex items-center gap-[12px] px-[16px] bg-[#0f172a]",
            children: [
              jsxs("div", {
                className: "flex items-center gap-[6px]",
                children: [
                  jsx("div", {
                    className: "w-[10px] h-[10px] rounded-full bg-[#f87171]",
                  }),
                  jsx("div", {
                    className: "w-[10px] h-[10px] rounded-full bg-[#fbbf24]",
                  }),
                  jsx("div", {
                    className: "w-[10px] h-[10px] rounded-full bg-[#34d399]",
                  }),
                ],
              }),
              jsx("div", {
                className: "text-[11px] font-mono text-[#cbd5e1]",
                children: "Category CLI v3",
              }),
              jsx("div", {
                className: "ml-auto text-[11px] font-mono text-[#475569]",
                children: "category-cli",
              }),
            ],
          }),
          jsx("div", {
            className:
              "app-bar shrink-0 sticky top-0 z-20 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-xl",
            children: jsxs("div", {
              className:
                "mx-auto max-w-[1280px] px-[16px] sm:px-[24px] h-[44px] flex items-center justify-between gap-[12px]",
              children: [
                jsxs("div", {
                  className: "flex items-center gap-[12px] overflow-x-auto no-scrollbar",
                  children: [
                    jsxs("div", {
                      className: "flex items-center gap-[6px] shrink-0",
                      children: [
                        jsx("kbd", {
                          className:
                            "px-[6px] h-[20px] rounded-[6px] bg-[#0f172a] text-white text-[10px] font-mono font-[700] flex items-center",
                          children: "LETTER",
                        }),
                        jsx("span", {
                          className: "text-[11px] font-[500] text-[#475569]",
                          style: {
                            fontFamily: "Inter",
                          },
                          children: "select",
                        }),
                      ],
                    }),
                    jsx("div", {
                      className: "w-[1px] h-[16px] bg-[#e2e8f0] shrink-0",
                    }),
                    jsxs("div", {
                      className: "flex items-center gap-[6px] shrink-0",
                      children: [
                        jsx("kbd", {
                          className:
                            "px-[6px] h-[20px] rounded-[6px] bg-[#2563eb] text-white text-[10px] font-mono font-[700] flex items-center",
                          children: "SPACE",
                        }),
                        jsx("span", {
                          className: "text-[11px] font-[500] text-[#475569]",
                          style: {
                            fontFamily: "Inter",
                          },
                          children: "run / arg",
                        }),
                      ],
                    }),
                    jsx("div", {
                      className: "w-[1px] h-[16px] bg-[#e2e8f0] shrink-0 hidden sm:block",
                    }),
                    jsxs("div", {
                      className: "hidden sm:flex items-center gap-[6px] shrink-0",
                      children: [
                        jsx("kbd", {
                          className:
                            "px-[6px] h-[20px] rounded-[6px] border border-[#e2e8f0] bg-white text-[10px] font-mono font-[700] flex items-center",
                          children: "ESC",
                        }),
                        jsx("span", {
                          className: "text-[11px] font-[500] text-[#475569]",
                          style: {
                            fontFamily: "Inter",
                          },
                          children: "back",
                        }),
                      ],
                    }),
                    jsxs("div", {
                      className: "hidden sm:flex items-center gap-[6px] shrink-0",
                      children: [
                        jsx("kbd", {
                          className:
                            "px-[6px] h-[20px] rounded-[6px] border border-[#e2e8f0] bg-white text-[10px] font-mono font-[700] flex items-center",
                          children: "⌫",
                        }),
                        jsx("span", {
                          className: "text-[11px] font-[500] text-[#475569]",
                          style: {
                            fontFamily: "Inter",
                          },
                          children: "clear",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
          jsx("div", {
            className: "app-scroll dot-bg flex-1 min-h-0 overflow-y-auto",
            children: jsx("div", {
              className: "baseline-lines",
              children: jsxs("div", {
                className: "mx-auto max-w-[1280px] px-[16px] sm:px-[24px] py-[24px] sm:py-[32px]",
                children: [
                  history.length > 0 &&
                    jsxs("div", {
                      className: "mb-[24px]",
                      children: [
                        jsxs("div", {
                          className: "space-y-[12px]",
                          children: [
                            history.map((item) =>
                              jsxs(
                                "div",
                                {
                                  className:
                                    "rounded-[12px] border border-[#e2e8f0] bg-white p-[12px] sm:p-[14px] flex flex-col gap-[10px]",
                                  children: [
                                    jsxs("div", {
                                      className: "flex items-center gap-[8px] flex-wrap",
                                      children: [
                                        jsxs("span", {
                                          className:
                                            "px-[8px] h-[22px] rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] text-[11px] font-mono font-[700] flex items-center",
                                          children: [item.category, " ", Z[item.category].label],
                                        }),
                                        jsxs("span", {
                                          className:
                                            "px-[8px] h-[22px] rounded-full bg-[#f5f3ff] border border-[#ddd6fe] text-[#7c3aed] text-[11px] font-mono font-[700] flex items-center",
                                          children: [
                                            item.action,
                                            " ",
                                            Z[item.category].actions[item.action]?.label,
                                          ],
                                        }),
                                        item.arg &&
                                          jsx("span", {
                                            className:
                                              "px-[8px] h-[22px] rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#92400e] text-[11px] font-mono font-[700] flex items-center",
                                            children: item.arg,
                                          }),
                                        jsxs("span", {
                                          className: "ml-auto text-[10px] font-mono text-[#94a3b8]",
                                          children: [item.ts, " • ", item.path],
                                        }),
                                      ],
                                    }),
                                    item.output.type === "list"
                                      ? jsx("div", {
                                          className: "grid grid-cols-2 sm:grid-cols-4 gap-[8px]",
                                          children: item.output.data.map((entry) =>
                                            jsxs(
                                              "div",
                                              {
                                                className: `h-[56px] rounded-[10px] border px-[10px] py-[8px] flex items-center gap-[8px] ${entry.type === "dir" ? "bg-[#eff6ff] border-[#bfdbfe]" : "bg-[#f8fafc] border-[#e2e8f0]"}`,
                                                children: [
                                                  jsx("div", {
                                                    className: `w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[12px] font-bold ${entry.type === "dir" ? "bg-[#2563eb] text-white" : "bg-white border"}`,
                                                    children: entry.type === "dir" ? "D" : "F",
                                                  }),
                                                  jsx("div", {
                                                    className: "text-[12px] font-[600] truncate",
                                                    style: {
                                                      fontFamily: "Inter",
                                                    },
                                                    children: entry.name,
                                                  }),
                                                ],
                                              },
                                              entry.name,
                                            ),
                                          ),
                                        })
                                      : jsx("pre", {
                                          className:
                                            "text-[12px] font-mono leading-[18px] bg-[#f8fafc] border border-[#f1f5f9] rounded-[8px] p-[10px] whitespace-pre-wrap break-words text-[#334155]",
                                          children: item.output.data,
                                        }),
                                  ],
                                },
                                item.id,
                              ),
                            ),
                          ],
                        }),
                      ],
                    }),
                  jsxs("div", {
                    className: "flex flex-col lg:flex-row gap-[24px] items-start",
                    children: [
                      jsxs("div", {
                        className: "flex-1 min-w-0 w-full",
                        children: [
                          jsxs("div", {
                            className:
                              "mt-[24px] rounded-[16px] border border-[#e2e8f0] bg-white/90 backdrop-blur p-[16px]",
                            children: [
                              jsxs("div", {
                                className: "flex items-center justify-between mb-[12px]",
                                children: [
                                  jsxs("div", {
                                    className: "flex items-center gap-[8px]",
                                    children: [
                                      jsx("div", {
                                        className:
                                          "w-[24px] h-[24px] rounded-[6px] bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[12px]",
                                        children: "📁",
                                      }),
                                      jsx("span", {
                                        className: "text-[12px] font-[700] tracking-[-0.01em]",
                                        style: {
                                          fontFamily: "Inter",
                                        },
                                        children: cwd,
                                      }),
                                      jsxs("span", {
                                        className: "text-[11px] font-mono text-[#94a3b8]",
                                        children: [items.length, " items"],
                                      }),
                                    ],
                                  }),
                                  jsx("div", {
                                    className:
                                      "text-[10px] uppercase tracking-[0.12em] text-[#94a3b8] font-[700]",
                                    style: {
                                      fontFamily: "Inter",
                                    },
                                    children: "Baseline grid 8px",
                                  }),
                                ],
                              }),
                              jsxs("div", {
                                className:
                                  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[8px]",
                                children: [
                                  items.map((item) =>
                                    jsxs(
                                      "div",
                                      {
                                        className: `h-[72px] rounded-[12px] border p-[10px] flex flex-col justify-between transition-colors ${item.type === "dir" ? "bg-[#eff6ff] border-[#bfdbfe] hover:bg-[#dbeafe]" : "bg-[#f8fafc] border-[#e2e8f0] hover:bg-white"}`,
                                        children: [
                                          jsxs("div", {
                                            className: "flex items-center justify-between",
                                            children: [
                                              jsx("div", {
                                                className: `w-[20px] h-[20px] rounded-[6px] flex items-center justify-center text-[12px] ${item.type === "dir" ? "bg-[#2563eb] text-white" : "bg-white border border-[#e2e8f0]"}`,
                                                children: item.type === "dir" ? "↗" : "◻",
                                              }),
                                              jsx("div", {
                                                className: "text-[9px] font-mono text-[#94a3b8]",
                                                children: item.type,
                                              }),
                                            ],
                                          }),
                                          jsx("div", {
                                            className: "text-[12px] font-[600] truncate",
                                            style: {
                                              fontFamily: "Inter",
                                            },
                                            children: item.name,
                                          }),
                                        ],
                                      },
                                      item.name,
                                    ),
                                  ),
                                  items.length === 0 &&
                                    jsx("div", {
                                      className:
                                        "col-span-full h-[72px] rounded-[12px] border border-dashed border-[#cbd5e1] flex items-center justify-center text-[12px] font-mono text-[#94a3b8]",
                                      children: "empty directory",
                                    }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      jsxs("div", {
                        className: "w-full lg:w-[320px] shrink-0",
                        children: [
                          jsxs("div", {
                            className:
                              "rounded-[16px] border border-[#e2e8f0] bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] overflow-hidden",
                            children: [
                              jsxs("div", {
                                className:
                                  "h-[48px] px-[16px] flex items-center justify-between border-b border-[#f1f5f9] bg-[#f8fafc]/80",
                                children: [
                                  jsxs("div", {
                                    className: "flex items-center gap-[8px]",
                                    children: [
                                      jsx("div", {
                                        className: "w-[6px] h-[6px] rounded-full bg-[#2563eb]",
                                      }),
                                      jsx("span", {
                                        className:
                                          "text-[11px] uppercase tracking-[0.14em] font-[800]",
                                        style: {
                                          fontFamily: "Inter",
                                        },
                                        children: menuCategory
                                          ? `${Z[menuCategory].full} ACTIONS`
                                          : "ACTIONS",
                                      }),
                                    ],
                                  }),
                                  jsx("div", {
                                    className: "text-[10px] font-mono text-[#94a3b8]",
                                    children: focusedCategory
                                      ? Object.keys(focusedCategory.actions).length + " keys"
                                      : "—",
                                  }),
                                ],
                              }),
                              jsxs("div", {
                                className: "p-[12px]",
                                children: [
                                  jsx("div", {
                                    className:
                                      "text-[10px] uppercase tracking-[0.12em] font-[800] text-[#94a3b8] mb-[8px]",
                                    style: {
                                      fontFamily: "Inter",
                                    },
                                    children: "Quick categories",
                                  }),
                                  jsx("div", {
                                    className: "grid grid-cols-4 gap-[8px]",
                                    children: Object.keys(Z).map((item) => {
                                      const selected =
                                        menuCategory === item || previewCategory === item;
                                      return jsxs(
                                        "button",
                                        {
                                          "data-testid": `cat-${item}`,
                                          onClick: () => {
                                            if (step === 0) {
                                              setPreviewCategory(item);
                                            } else {
                                              setCommittedCategory(item);
                                              setPreviewCategory(null);
                                              setPreviewAction(null);
                                              setCommittedAction(null);
                                              setStep(1);
                                              setArg("");
                                            }
                                            setFlash(`cat-${item}`);
                                            setTimeout(() => setFlash(null), 400);
                                            shellRef.current?.focus();
                                          },
                                          className: `h-[64px] rounded-[10px] border flex flex-col items-center justify-center gap-[4px] transition-all ${selected ? "bg-[#0f172a] border-[#0f172a] text-white shadow-[0_0_0_3px_rgba(15,23,42,0.15)]" : "bg-[#f8fafc] border-[#e2e8f0] hover:bg-white hover:border-[#cbd5e1] text-[#0f172a]"}`,
                                          children: [
                                            jsx("span", {
                                              className: "text-[18px] font-[800] font-mono",
                                              children: item.toUpperCase(),
                                            }),
                                            jsx("span", {
                                              className:
                                                "text-[9px] uppercase tracking-[0.1em] font-[700] opacity-80",
                                              style: {
                                                fontFamily: "Inter",
                                              },
                                              children: Z[item].label,
                                            }),
                                          ],
                                        },
                                        item,
                                      );
                                    }),
                                  }),
                                  !menuCategory &&
                                    jsxs("div", {
                                      className:
                                        "mt-[12px] text-[12px] font-mono text-[#94a3b8] leading-[16px] bg-[#f8fafc] border border-dashed border-[#e2e8f0] rounded-[10px] p-[10px] text-center",
                                      children: [
                                        "Press a category key to see its actions",
                                        jsx("br", {}),
                                        jsx("span", {
                                          className: "text-[#0f172a] font-bold",
                                          children: "[D] dir [F] file [S] system [H] help",
                                        }),
                                      ],
                                    }),
                                ],
                              }),
                              menuCategory &&
                                jsxs("div", {
                                  className: "p-[12px] pt-0",
                                  children: [
                                    jsx("div", {
                                      className: "grid grid-cols-2 gap-[8px]",
                                      children: Object.entries(Z[menuCategory].actions).map(
                                        ([key, actionDef]) => {
                                          const hovered = step === 1 && previewAction === key;
                                          const committed = committedAction === key;
                                          return jsxs(
                                            "button",
                                            {
                                              onClick: () => {
                                                if (step === 0) {
                                                  setCommittedCategory(menuCategory);
                                                  setStep(1);
                                                  setPreviewCategory(null);
                                                  setPreviewAction(key);
                                                } else if (step === 1) {
                                                  setPreviewAction(key);
                                                }
                                                shellRef.current?.focus();
                                              },
                                              className: `text-left rounded-[12px] border p-[10px] h-[84px] flex flex-col justify-between transition-all ${hovered ? "bg-[#f5f3ff] border-[#7c3aed] shadow-[0_0_0_3px_rgba(124,58,237,0.12)]" : committed ? "bg-[#7c3aed] border-[#7c3aed] text-white" : "bg-[#f8fafc] border-[#e2e8f0] hover:bg-white hover:border-[#cbd5e1]"}`,
                                              children: [
                                                jsxs("div", {
                                                  className: "flex items-center justify-between",
                                                  children: [
                                                    jsx("span", {
                                                      className: `text-[14px] font-[800] font-mono px-[6px] h-[20px] rounded-[6px] flex items-center ${committed ? "bg-white/20" : hovered ? "bg-[#7c3aed] text-white" : "bg-[#0f172a] text-white"}`,
                                                      children: key.toUpperCase(),
                                                    }),
                                                    actionDef.needsArg &&
                                                      jsx("span", {
                                                        className: `text-[8px] px-[6px] h-[16px] rounded-full font-[800] uppercase tracking-[0.08em] ${committed ? "bg-white/20 text-white" : "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]"}`,
                                                        children: "arg",
                                                      }),
                                                  ],
                                                }),
                                                jsxs("div", {
                                                  children: [
                                                    jsx("div", {
                                                      className: `text-[12px] font-[700] leading-[14px] ${committed ? "text-white" : "text-[#0f172a]"}`,
                                                      style: {
                                                        fontFamily: "Inter",
                                                      },
                                                      children: actionDef.label,
                                                    }),
                                                    jsx("div", {
                                                      className: `text-[10px] leading-[12px] mt-[2px] line-clamp-2 ${committed ? "text-white/80" : "text-[#64748b]"}`,
                                                      style: {
                                                        fontFamily: "Inter",
                                                      },
                                                      children: actionDef.desc,
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            },
                                            key,
                                          );
                                        },
                                      ),
                                    }),
                                    ((step === 1 && previewAction && committedCategory) ||
                                      (step === 2 && committedAction && committedCategory)) &&
                                      jsxs("div", {
                                        className:
                                          "mt-[12px] rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] p-[10px]",
                                        children: [
                                          jsxs("div", {
                                            className:
                                              "text-[10px] uppercase tracking-[0.12em] font-[800] text-[#64748b] mb-[8px]",
                                            style: {
                                              fontFamily: "Inter",
                                            },
                                            children: [
                                              "Options for ",
                                              Z[committedCategory].actions[
                                                previewAction || committedAction
                                              ].label,
                                            ],
                                          }),
                                          jsx("div", {
                                            className: "space-y-[6px]",
                                            children: Z[committedCategory].actions[
                                              previewAction || committedAction
                                            ].variants.map((item) =>
                                              jsxs(
                                                "div",
                                                {
                                                  className:
                                                    "flex items-center gap-[8px] text-[11px] font-mono text-[#475569] px-[8px] h-[28px] rounded-[8px] bg-white border border-[#f1f5f9]",
                                                  children: [
                                                    jsx("span", {
                                                      className:
                                                        "w-[4px] h-[4px] rounded-full bg-[#94a3b8]",
                                                    }),
                                                    item,
                                                  ],
                                                },
                                                item,
                                              ),
                                            ),
                                          }),
                                          step === 2 &&
                                            jsx("div", {
                                              className:
                                                "mt-[8px] text-[10px] font-mono text-[#94a3b8]",
                                              children:
                                                "Type arg above, then SPACE or ENTER to commit",
                                            }),
                                        ],
                                      }),
                                    step === 2 &&
                                      jsx("div", {
                                        className: "mt-[12px] grid grid-cols-3 gap-[6px]",
                                        children: ["..", "/", "new"].map((item) =>
                                          jsx(
                                            "button",
                                            {
                                              onClick: () => {
                                                setArg(item);
                                                shellRef.current?.focus();
                                              },
                                              className:
                                                "h-[28px] rounded-[8px] border border-[#e2e8f0] bg-white text-[11px] font-mono hover:bg-[#fffbeb] hover:border-[#fde68a]",
                                              children: item,
                                            },
                                            item,
                                          ),
                                        ),
                                      }),
                                  ],
                                }),
                              jsxs("div", {
                                className:
                                  "px-[12px] py-[10px] bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center gap-[6px] flex-wrap",
                                children: [
                                  jsx("span", {
                                    className:
                                      "text-[10px] font-[700] uppercase tracking-[0.1em] text-[#94a3b8]",
                                    style: {
                                      fontFamily: "Inter",
                                    },
                                    children: "Keys",
                                  }),
                                  jsx("span", {
                                    className:
                                      "text-[10px] font-mono bg-white border border-[#e2e8f0] px-[6px] h-[20px] rounded-[6px] flex items-center",
                                    children: "D F S H",
                                  }),
                                  jsx("span", {
                                    className:
                                      "text-[10px] font-mono bg-[#0f172a] text-white px-[6px] h-[20px] rounded-[6px] flex items-center",
                                    children: "SPACE run/arg",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          jsxs("div", {
                            className:
                              "mt-[12px] rounded-[12px] border border-[#e2e8f0] bg-white p-[12px] flex gap-[8px]",
                            children: [
                              jsxs("div", {
                                className: "flex-1",
                                children: [
                                  jsx("div", {
                                    className:
                                      "text-[10px] uppercase tracking-[0.12em] font-[800] text-[#94a3b8]",
                                    style: {
                                      fontFamily: "Inter",
                                    },
                                    children: "Step",
                                  }),
                                  jsx("div", {
                                    className: "flex items-center gap-[4px] mt-[6px]",
                                    children: [0, 1, 2].map((item) =>
                                      jsx(
                                        "div",
                                        {
                                          className: `h-[6px] flex-1 rounded-full ${step >= item ? "bg-[#0f172a]" : "bg-[#e2e8f0]"}`,
                                        },
                                        item,
                                      ),
                                    ),
                                  }),
                                  jsx("div", {
                                    className: "text-[11px] font-mono mt-[6px] text-[#334155]",
                                    children:
                                      step === 0
                                        ? "type category + action"
                                        : step === 1
                                          ? "choose action"
                                          : "type argument",
                                  }),
                                ],
                              }),
                              jsx("div", {
                                className: "w-[1px] bg-[#e2e8f0]",
                              }),
                              jsxs("div", {
                                className: "flex-1",
                                children: [
                                  jsx("div", {
                                    className:
                                      "text-[10px] uppercase tracking-[0.12em] font-[800] text-[#94a3b8]",
                                    style: {
                                      fontFamily: "Inter",
                                    },
                                    children: "Focus",
                                  }),
                                  jsxs("div", {
                                    className:
                                      "mt-[6px] text-[11px] font-mono leading-[14px] text-[#334155]",
                                    children: [
                                      "box ",
                                      step + 1,
                                      " • ",
                                      step === 0 ? "blue" : step === 1 ? "violet" : "amber",
                                      " glow • 8px grid",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
          }),
          jsx("div", {
            className:
              "app-footer shrink-0 z-20 backdrop-blur-xl bg-white/80 border-t border-[#e2e8f0]",
            children: jsxs("div", {
              className:
                "mx-auto max-w-[1280px] px-[24px] h-[64px] flex items-center justify-between",
              children: [
                jsxs("div", {
                  className: "flex items-center gap-[16px] min-w-0 flex-1",
                  children: [
                    jsx("div", {
                      className:
                        "w-[32px] h-[32px] rounded-[8px] bg-[#0f172a] text-white flex items-center justify-center font-mono font-bold text-[14px] shrink-0",
                      children: "⌘",
                    }),
                    jsxs("div", {
                      className:
                        "flex items-center gap-[6px] min-w-0 flex-1 overflow-x-auto no-scrollbar",
                      children: [
                        jsxs("div", {
                          className: `flex items-center gap-[6px] h-[32px] px-[10px] rounded-[8px] border-[2px] font-mono text-[12px] font-[800] shrink-0 ${committedCategory ? "bg-[#2563eb] border-[#2563eb] text-white" : previewCategory ? "bg-[#eff6ff] border-[#2563eb] text-[#1d4ed8]" : "bg-white border-[#cbd5e1] text-[#94a3b8]"}`,
                          children: [
                            committedCategory
                              ? committedCategory.toUpperCase()
                              : previewCategory
                                ? previewCategory.toUpperCase()
                                : "–",
                            jsx("span", {
                              className: "text-[10px] font-[700] uppercase tracking-[0.08em]",
                              style: {
                                fontFamily: "Inter",
                              },
                              children: committedCategory
                                ? Z[committedCategory].label
                                : previewCategory
                                  ? Z[previewCategory].label
                                  : "cat",
                            }),
                            step === 0 &&
                              jsx("div", {
                                className:
                                  "w-[8px] h-[16px] bg-[#2563eb] cursor-blink rounded-[2px]",
                              }),
                            committedCategory &&
                              jsx("span", {
                                className: "text-[12px]",
                                children: "✓",
                              }),
                          ],
                        }),
                        jsx("span", {
                          className: "text-[#cbd5e1] font-mono shrink-0",
                          children: "›",
                        }),
                        jsxs("div", {
                          className: `flex items-center gap-[6px] h-[32px] px-[10px] rounded-[8px] border-[2px] font-mono text-[12px] font-[800] shrink-0 ${committedAction ? "bg-[#7c3aed] border-[#7c3aed] text-white" : previewAction ? "bg-[#f5f3ff] border-[#7c3aed] text-[#6d28d9]" : step === 1 ? "bg-white border-[#7c3aed] text-[#0f172a]" : "bg-white border-[#cbd5e1] text-[#94a3b8]"}`,
                          children: [
                            committedAction
                              ? committedAction.toUpperCase()
                              : previewAction
                                ? previewAction.toUpperCase()
                                : step === 1
                                  ? "_"
                                  : "–",
                            jsx("span", {
                              className: "text-[10px] font-[700] uppercase tracking-[0.08em]",
                              style: {
                                fontFamily: "Inter",
                              },
                              children:
                                committedAction && committedCategory
                                  ? Z[committedCategory].actions[committedAction].label
                                  : previewAction && committedCategory
                                    ? Z[committedCategory].actions[previewAction].label
                                    : "act",
                            }),
                            step === 1 &&
                              jsx("div", {
                                className:
                                  "w-[8px] h-[16px] bg-[#7c3aed] cursor-blink rounded-[2px]",
                              }),
                            committedAction &&
                              jsx("span", {
                                className: "text-[12px]",
                                children: "✓",
                              }),
                          ],
                        }),
                        jsx("span", {
                          className: "text-[#cbd5e1] font-mono shrink-0",
                          children: "›",
                        }),
                        jsxs("div", {
                          className: `flex items-center gap-[6px] h-[32px] px-[10px] rounded-[8px] border-[2px] font-mono text-[12px] font-[800] shrink-0 max-w-[220px] ${step === 2 || arg ? "bg-[#fffbeb] border-[#d97706] text-[#92400e]" : "bg-white border-[#cbd5e1] text-[#94a3b8]"}`,
                          children: [
                            jsx("span", {
                              className: "text-[10px] font-[700] uppercase tracking-[0.08em]",
                              style: {
                                fontFamily: "Inter",
                              },
                              children: "arg",
                            }),
                            jsx("span", {
                              className: "truncate",
                              children: arg || (step === 2 ? "" : "—"),
                            }),
                            step === 2 &&
                              jsx("div", {
                                className:
                                  "w-[8px] h-[16px] bg-[#d97706] cursor-blink rounded-[2px] shrink-0",
                              }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                jsxs("div", {
                  className: "flex items-center gap-[12px]",
                  children: [
                    jsxs("div", {
                      className:
                        "hidden sm:flex items-center gap-[8px] px-[12px] h-[32px] rounded-full bg-[#f1f5f9] border border-[#e2e8f0]",
                      children: [
                        jsx("div", {
                          className: "w-[6px] h-[6px] rounded-full bg-emerald-500 animate-pulse",
                        }),
                        jsx("span", {
                          className: "text-[11px] font-mono text-[#475569]",
                          children: cwd,
                        }),
                      ],
                    }),
                    jsxs("div", {
                      className: "text-[11px] font-mono text-[#94a3b8] hidden md:block",
                      children: [items.length, " items"],
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
ReactDOM.createRoot(document.getElementById("root")).render(
  jsx(React.StrictMode, {
    children: jsx(App, {}),
  }),
);
