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

function joinPath(base, name) {
  if (name === ".." || name === "../") {
    if (base === "/" || base === "") return "/";
    const parts = base.split("/").filter(Boolean);
    parts.pop();
    return parts.length ? "/" + parts.join("/") : "/";
  }
  if (name === "/" || name === "") return "/";
  return base === "/" ? `/${name}` : `${base}/${name}`;
}

function listingFor(tree, path) {
  const node = getNode(tree, path);
  if (!node || node.type !== "dir") return null;
  return Object.entries(node.children).map(([name, child]) => ({
    name,
    type: child.type,
  }));
}

function cloneFs(node) {
  const children = {};
  for (const [name, child] of Object.entries(node.children)) {
    children[name] = child.type === "dir" ? cloneFs(child) : { ...child };
  }
  return { type: "dir", children };
}

function firstToken(value) {
  const trimmedStart = value.replace(/^\s+/, "");
  const space = trimmedStart.indexOf(" ");
  return space === -1 ? trimmedStart : trimmedStart.slice(0, space);
}

function matchPrograms(query) {
  const q = firstToken(query).toLowerCase();
  if (!q) return PROGRAMS.slice();
  const starts = PROGRAMS.filter((prog) => prog.name.toLowerCase().startsWith(q));
  if (starts.length) return starts;
  return PROGRAMS.filter((prog) => prog.name.toLowerCase().includes(q));
}

function childDirNames(node) {
  if (!node || node.type !== "dir") return [];
  return Object.entries(node.children)
    .filter(([, child]) => child.type === "dir")
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));
}

function dirSuggestNames(node) {
  return ["..", "/"].concat(childDirNames(node));
}

function matchNames(query, names) {
  const q = firstToken(query).toLowerCase();
  if (!q) return names.slice();
  const starts = names.filter((name) => name.toLowerCase().startsWith(q));
  if (starts.length) return starts;
  return names.filter((name) => name.toLowerCase().includes(q));
}

function resolveUniqueName(raw, names) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const q = firstToken(trimmed).toLowerCase();
  const exact = names.find((name) => name.toLowerCase() === q);
  if (exact) return exact;
  const starts = names.filter((name) => name.toLowerCase().startsWith(q));
  if (starts.length === 1) return starts[0];
  return null;
}

const SHORT_WORDS = {
  directory: "dir",
  program: "prog",
  system: "sys",
  execute: "exec",
  navigate: "nav",
  rename: "ren",
}

function shortWord(word) {
  return SHORT_WORDS[word] || word;
}

function formatHint(text, enterKeyName) {
  if (!text) return "";
  return text.replace("{enter}", enterKeyName);
}

function isAppleOs() {
  const platform = navigator.platform || "";
  const ua = navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X|iPhone|iPad|iPod/.test(ua);
}

function resolveProgram(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\s+/);
  const q = parts[0].toLowerCase();
  const extra = parts.slice(1).join(" ");
  const exact = PROGRAMS.find((prog) => prog.name.toLowerCase() === q);
  if (exact) return { ...exact, extra };
  const starts = PROGRAMS.filter((prog) => prog.name.toLowerCase().startsWith(q));
  if (starts.length === 1) return { ...starts[0], extra };
  return null;
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
  const logRef = React.useRef(null);
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

  const historyLenRef = React.useRef(0);
  React.useEffect(() => {
    if (history.length === historyLenRef.current) return;
    historyLenRef.current = history.length;
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  const openDirInEntry = (entryId, name) => {
    setHistory((entries) =>
      entries.map((entry) => {
        if (entry.id !== entryId || entry.output?.type !== "list") return entry;
        const stack = entry.browse?.stack ?? [entry.path];
        const index = entry.browse?.index ?? 0;
        const nextPath = joinPath(stack[index], name);
        const data = listingFor(fs, nextPath);
        if (!data) return entry;
        const nextStack = stack.slice(0, index + 1).concat(nextPath);
        return {
          ...entry,
          output: { ...entry.output, data },
          browse: { stack: nextStack, index: nextStack.length - 1 },
        };
      }),
    );
  };

  const stepBrowse = (entryId, delta) => {
    setHistory((entries) =>
      entries.map((entry) => {
        if (entry.id !== entryId || !entry.browse) return entry;
        const index = entry.browse.index + delta;
        if (index < 0 || index >= entry.browse.stack.length) return entry;
        const data = listingFor(fs, entry.browse.stack[index]);
        if (!data) return entry;
        return {
          ...entry,
          output: { ...entry.output, data },
          browse: { ...entry.browse, index },
        };
      }),
    );
  };

  const runCommand = (category, action, rawArg) => {
    const id = Math.random().toString(36).slice(2, 8);
    const ts = new Date().toLocaleTimeString([], { hour12: false });
    let output = { type: "text", data: "" };
    let nextFs = fs;
    let nextCwd = cwd;

    if (category === "d") {
      if (action === "l") {
        output = {
          type: "list",
          data: listingFor(nextFs, nextCwd) || [],
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
      } else if (action === "n") {
        if (rawArg === ".." || rawArg === "../") {
          if (nextCwd !== "/") {
            const parts = nextCwd.split("/").filter(Boolean);
            parts.pop();
            nextCwd = "/" + parts.join("/");
            if (nextCwd === "") nextCwd = "/";
            setCwd(nextCwd);
            output = { type: "none" };
          } else {
            output = { type: "text", data: "already at root" };
          }
        } else if (rawArg === "/" || rawArg === "") {
          nextCwd = "/";
          setCwd("/");
          output = { type: "none" };
        } else {
          const resolved =
            resolveUniqueName(rawArg, childDirNames(getNode(fs, nextCwd))) || rawArg;
          const target = nextCwd === "/" ? `/${resolved}` : `${nextCwd}/${resolved}`;
          const dir = getNode(fs, target);
          if (dir && dir.type === "dir") {
            nextCwd = target;
            setCwd(target);
            output = { type: "none" };
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
      } else if (action === "e") {
        const trimmed = rawArg.trim();
        const space = trimmed.indexOf(" ");
        const fromTok = space === -1 ? trimmed : trimmed.slice(0, space);
        const toName = space === -1 ? "" : trimmed.slice(space).trim();
        const dir = getNode(nextFs, nextCwd);
        const names = childDirNames(dir);
        const fromName = resolveUniqueName(fromTok, names) || fromTok;
        if (!fromTok) {
          output = { type: "text", data: "error: folder name required" };
        } else if (!toName) {
          output = { type: "text", data: "error: new name required" };
        } else if (!dir || !(fromName in dir.children) || dir.children[fromName].type !== "dir") {
          output = { type: "text", data: `error: folder '${fromTok}' not found` };
        } else if (toName in dir.children && toName !== fromName) {
          output = { type: "text", data: `error: '${toName}' already exists` };
        } else {
          nextFs = cloneFs(fs);
          const children = getNode(nextFs, nextCwd).children;
          children[toName] = children[fromName];
          if (toName !== fromName) delete children[fromName];
          setFs(nextFs);
          const oldPath = joinPath(nextCwd, fromName);
          const newPath = joinPath(nextCwd, toName);
          if (nextCwd === oldPath || nextCwd.startsWith(oldPath + "/")) {
            nextCwd = nextCwd === oldPath ? newPath : newPath + nextCwd.slice(oldPath.length);
            setCwd(nextCwd);
          }
          output = { type: "text", data: `renamed '${fromName}' to '${toName}'` };
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
    } else if (category === "p") {
      if (action === "l") {
        output = {
          type: "list",
          data: PROGRAMS.map((prog) => ({ name: prog.name, type: "prog", desc: prog.desc })),
        };
      } else if (action === "x") {
        const resolved = resolveProgram(rawArg);
        if (!resolved) {
          output = {
            type: "text",
            data: rawArg.trim()
              ? `error: program '${firstToken(rawArg)}' not found`
              : "error: program name required",
          };
        } else {
          const suffix = resolved.extra ? ` ${resolved.extra}` : "";
          output = {
            type: "text",
            data: `launched '${resolved.name}'${suffix} — ${resolved.desc}`,
          };
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
          data: "help: d=directory f=file p=program s=system h=help | action letter opens arg | enter=run | tab=complete | delete=back",
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
          data: "categories: [d] directory, [f] file, [p] program, [s] system, [h] help",
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
    setHistory((entries) => [...entries, entry].slice(-30));
    setFlash("ok");
    setTimeout(() => setFlash(null), 400);
  };

  const resetFields = () => {
    setCommittedCategory(null);
    setCommittedAction(null);
    setPreviewCategory(null);
    setPreviewAction(null);
    setArg("");
    setStep(0);
  };

  const chooseCategory = (letter) => {
    setCommittedCategory(letter);
    setPreviewCategory(null);
    setPreviewAction(null);
    setCommittedAction(null);
    setArg("");
    setStep(1);
  };

  const chooseAction = (category, actionKey) => {
    if (!category || !Z[category]?.actions[actionKey]) return;
    setCommittedCategory(category);
    setPreviewCategory(null);
    setPreviewAction(null);
    setCommittedAction(actionKey);
    setArg("");
    setStep(Z[category].actions[actionKey].needsArg ? 2 : 1);
  };

  const execute = () => {
    if (!committedCategory || !committedAction) return;
    const needsArg = Z[committedCategory].actions[committedAction].needsArg;
    runCommand(committedCategory, committedAction, needsArg ? arg.trim() : "");
    resetFields();
  };

  const onKeyDown = (event) => {
    const key = event.key;
    if (key === " ") event.preventDefault();

    if (step === 0) {
      if (/^[a-zA-Z]$/.test(key)) {
        const letter = key.toLowerCase();
        if (letter in Z) chooseCategory(letter);
      } else if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        setPreviewCategory(null);
      } else if (key === "Escape") {
        resetFields();
      }
    } else if (step === 1) {
      if (/^[a-zA-Z]$/.test(key)) {
        const letter = key.toLowerCase();
        if (committedCategory && letter in Z[committedCategory].actions) {
          chooseAction(committedCategory, letter);
        }
      } else if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        if (committedAction) {
          setCommittedAction(null);
          setArg("");
        } else {
          resetFields();
        }
      } else if (key === "Escape") {
        resetFields();
      } else if (key === "Enter") {
        event.preventDefault();
        if (committedAction && !Z[committedCategory].actions[committedAction].needsArg) {
          execute();
        }
      }
    } else if (step === 2) {
      if (key === "Escape") {
        setArg("");
        setCommittedAction(null);
        setStep(1);
      } else if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        if (arg.length > 0) {
          setArg((value) => value.slice(0, -1));
        } else {
          setCommittedAction(null);
          setStep(1);
        }
      } else if (key === "Tab") {
        event.preventDefault();
        const actionDef =
          committedCategory && committedAction
            ? Z[committedCategory].actions[committedAction]
            : null;
        let names = [];
        if (actionDef?.suggest === "programs") {
          names = matchPrograms(arg).map((prog) => prog.name);
        } else if (actionDef?.suggest === "dirs") {
          names = matchNames(arg, dirSuggestNames(cwdNode));
        } else if (actionDef?.suggest === "child-dirs") {
          names = matchNames(arg, childDirNames(cwdNode));
        }
        if (!names.length) return;
        const token = firstToken(arg);
        const idx = names.findIndex((name) => name === token);
        const next = names[idx === -1 ? 0 : (idx + 1) % names.length];
        const restIdx = arg.indexOf(" ");
        const rest = restIdx === -1 ? "" : arg.slice(restIdx);
        setArg(next + rest);
      } else if (key === "Enter") {
        event.preventDefault();
        execute();
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey) {
        setArg((value) => value + key);
      }
    }
  };

  const enterKeyName = isAppleOs() ? "Return" : "Enter";
  const enterKeyGlyph = isAppleOs() ? "↩" : "↵";
  const canGoWithoutArg =
    Boolean(committedCategory && committedAction) &&
    !Z[committedCategory].actions[committedAction].needsArg;
  const cmdlineHint = canGoWithoutArg
    ? formatHint(
        Z[committedCategory].actions[committedAction].goHint ||
          `press ${enterKeyName} to run`,
        enterKeyName,
      )
    : step === 2 && committedAction
      ? Z[committedCategory].actions[committedAction].argHint || "type filename"
      : "";
  const menuCategory = committedCategory || previewCategory;
  const activeActionDef =
    committedCategory && (previewAction || committedAction)
      ? Z[committedCategory].actions[previewAction || committedAction]
      : null;
  const suggestKind = step === 2 ? activeActionDef?.suggest : null;
  const suggesting =
    suggestKind === "programs" ||
    suggestKind === "dirs" ||
    suggestKind === "child-dirs";
  const suggestMatches =
    suggestKind === "programs"
      ? matchPrograms(arg).map((prog) => prog.name)
      : suggestKind === "dirs"
        ? matchNames(arg, dirSuggestNames(cwdNode))
        : suggestKind === "child-dirs"
          ? matchNames(arg, childDirNames(cwdNode))
          : [];
  return jsxs("div", {
    id: "app-shell",
    ref: shellRef,
    tabIndex: 0,
    onKeyDown: onKeyDown,
    className:
      "app-shell h-full w-full bg-[#0b1220] text-[#0f172a] outline-none selection:bg-blue-200 flex justify-center overflow-hidden p-[12px] sm:p-[24px]",
    children: [
      jsxs("div", {
        id: "app-frame",
        className:
          "app-frame w-full max-w-[1280px] h-full max-h-full min-h-0 flex flex-col overflow-hidden rounded-[16px] border border-[#334155] bg-[#f8fafc] shadow-2xl",
        children: [
          jsxs("div", {
            id: "titlebar",
            className: "h-[40px] shrink-0 flex items-center gap-[12px] px-[16px] bg-[#0f172a]",
            children: [
              jsxs("div", {
                id: "titlebar-lights",
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
                id: "titlebar-title",
                className: "text-[11px] font-mono text-[#cbd5e1]",
                children: "Category CLI v3",
              }),
              jsx("div", {
                id: "titlebar-cwd",
                className: "ml-auto text-[11px] font-mono text-[#94a3b8] truncate min-w-0",
                title: cwd,
                children: cwd,
              }),
            ],
          }),
          jsx("div", {
            id: "log",
            ref: logRef,
            className: "app-scroll dot-bg flex-1 min-h-0 overflow-y-auto",
            children: jsx("div", {
              id: "log-grid",
              className: "baseline-lines",
              children: jsx("div", {
                id: "log-inner",
                className: "mx-auto max-w-[1280px] px-[16px] sm:px-[24px] py-[24px] sm:py-[32px]",
                children:
                  history.length > 0 &&
                  jsx("div", {
                    id: "log-list",
                    className: "space-y-[12px]",
                    children: history.map((item) =>
                      jsxs(
                        "div",
                        {
                          id: `log-entry-${item.id}`,
                          className:
                            "rounded-[12px] border border-[#e2e8f0] bg-white p-[12px] sm:p-[14px] flex flex-col gap-[10px]",
                          children: [
                            jsxs("div", {
                              id: `log-entry-head-${item.id}`,
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
                              ? jsxs("div", {
                                  className: "flex flex-col gap-[10px]",
                                  children: [
                                    item.browse &&
                                      item.browse.stack.length > 1 &&
                                      jsxs("div", {
                                        id: `log-entry-nav-${item.id}`,
                                        className: "log-nav",
                                        children: [
                                          jsx("button", {
                                            id: `log-entry-back-${item.id}`,
                                            type: "button",
                                            className: "log-nav-btn",
                                            disabled: item.browse.index === 0,
                                            onMouseDown: (event) => event.preventDefault(),
                                            onClick: () => {
                                              stepBrowse(item.id, -1);
                                              shellRef.current?.focus();
                                            },
                                            children: "Back",
                                          }),
                                          jsx("button", {
                                            id: `log-entry-forward-${item.id}`,
                                            type: "button",
                                            className: "log-nav-btn",
                                            disabled:
                                              item.browse.index >= item.browse.stack.length - 1,
                                            onMouseDown: (event) => event.preventDefault(),
                                            onClick: () => {
                                              stepBrowse(item.id, 1);
                                              shellRef.current?.focus();
                                            },
                                            children: "Forward",
                                          }),
                                          jsx("span", {
                                            className: "log-nav-path",
                                            children: item.browse.stack[item.browse.index],
                                          }),
                                        ],
                                      }),
                                    jsxs("div", {
                                  id: `log-entry-list-${item.id}`,
                                  className: "grid grid-cols-2 sm:grid-cols-4 gap-[8px]",
                                  children: [
                                    ...item.output.data.map((entry) => {
                                      const isDir = entry.type === "dir";
                                      return jsxs(
                                      isDir ? "button" : "div",
                                      {
                                        id: `log-entry-item-${item.id}-${entry.name}`,
                                        type: isDir ? "button" : undefined,
                                        onMouseDown: isDir
                                          ? (event) => event.preventDefault()
                                          : undefined,
                                        onClick: isDir
                                          ? () => {
                                              openDirInEntry(item.id, entry.name);
                                              shellRef.current?.focus();
                                            }
                                          : undefined,
                                        className: `h-[56px] rounded-[10px] border px-[10px] py-[8px] flex items-center gap-[8px] text-left ${isDir ? "log-dir-item bg-[#eff6ff] border-[#bfdbfe]" : "bg-[#f8fafc] border-[#e2e8f0]"}`,
                                        children: [
                                          jsx("div", {
                                            className: `w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[12px] font-bold ${isDir ? "bg-[#2563eb] text-white" : entry.type === "prog" ? "bg-emerald-500 text-white" : "bg-white border"}`,
                                            children: isDir
                                                ? "D"
                                                : entry.type === "prog"
                                                  ? "P"
                                                  : "F",
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
                                    );
                                    }),
                                    item.output.data.length === 0 &&
                                      jsx("div", {
                                        className:
                                          "col-span-full h-[56px] rounded-[10px] border border-dashed border-[#cbd5e1] flex items-center justify-center text-[12px] font-mono text-[#94a3b8]",
                                        children: "empty directory",
                                      }),
                                  ],
                                }),
                                  ],
                                })
                              : item.output.type === "text" &&
                                item.output.data &&
                                jsx("pre", {
                                  className:
                                    "text-[12px] font-mono leading-[18px] bg-[#f8fafc] border border-[#f1f5f9] rounded-[8px] p-[10px] whitespace-pre-wrap break-words text-[#334155]",
                                  children: item.output.data,
                                }),
                          ],
                        },
                        item.id,
                      ),
                    ),
                  }),
              }),
            }),
          }),
          step >= 1 &&
            committedAction &&
            committedCategory &&
            (suggesting ||
              (activeActionDef.variants && activeActionDef.variants.length > 0) ||
              (step === 2 && activeActionDef.shortcuts)) &&
            jsx("div", {
              id: "options",
              className:
                "app-options shrink-0 z-20 border-t border-[#e2e8f0] bg-white/90 backdrop-blur-xl",
              children: jsxs("div", {
                id: "options-inner",
                className:
                  "mx-auto max-w-[1280px] px-[16px] sm:px-[24px] py-[10px] flex items-center gap-[8px] min-w-0 overflow-x-auto no-scrollbar",
                children: [
                  (suggesting ||
                    (activeActionDef.variants && activeActionDef.variants.length > 0)) &&
                    jsxs("span", {
                      className:
                        "text-[10px] uppercase tracking-[0.12em] font-[800] text-[#64748b] shrink-0",
                      style: {
                        fontFamily: "Inter",
                      },
                      children: [
                        "Options for ",
                        activeActionDef.label,
                      ],
                    }),
                  ...(suggesting
                    ? suggestMatches.length
                      ? suggestMatches.map((name, index) =>
                          jsx(
                            "button",
                            {
                              id: `option-suggest-${String(name).replace(/\s+/g, "-")}`,
                              onClick: () => {
                                const restIdx = arg.indexOf(" ");
                                const rest = restIdx === -1 ? "" : arg.slice(restIdx);
                                setArg(name + rest);
                                shellRef.current?.focus();
                              },
                              className: `h-[28px] px-[10px] rounded-[8px] border text-[11px] font-mono shrink-0 ${index === 0 ? "bg-[#fffbeb] border-[#fde68a] text-[#92400e]" : "bg-white border-[#e2e8f0] text-[#475569] hover:bg-[#fffbeb] hover:border-[#fde68a]"}`,
                              children: name,
                            },
                            name,
                          ),
                        )
                      : [
                          jsx("span", {
                            className: "text-[11px] font-mono text-[#94a3b8] shrink-0",
                            children: "no matches",
                          }),
                        ]
                    : (activeActionDef.variants || []).map((item) =>
                        jsxs(
                          "div",
                          {
                            id: `option-variant-${item.replace(/\s+/g, "-")}`,
                            className:
                              "flex items-center gap-[8px] text-[11px] font-mono text-[#475569] px-[8px] h-[28px] rounded-[8px] bg-[#f8fafc] border border-[#f1f5f9] shrink-0",
                            children: [
                              jsx("span", {
                                className: "w-[4px] h-[4px] rounded-full bg-[#94a3b8]",
                              }),
                              item,
                            ],
                          },
                          item,
                        ),
                      )),
                  step === 2 &&
                    !suggesting &&
                    activeActionDef.shortcuts &&
                    jsx("div", {
                      id: "options-shortcuts",
                      className: "flex items-center gap-[6px] shrink-0",
                      children: activeActionDef.shortcuts.map((item) =>
                        jsx(
                          "button",
                          {
                            onClick: () => {
                              setArg(item);
                              shellRef.current?.focus();
                            },
                            className:
                              "h-[28px] px-[10px] rounded-[8px] border border-[#e2e8f0] bg-white text-[11px] font-mono hover:bg-[#fffbeb] hover:border-[#fde68a]",
                            children: item,
                          },
                          item,
                        ),
                      ),
                    }),
                ],
              }),
            }),
          committedCategory &&
            !committedAction &&
            jsx("div", {
            id: "actions",
            className:
              "app-actions shrink-0 z-20 border-t border-[#e2e8f0] bg-white/90 backdrop-blur-xl",
            children: jsx("div", {
              id: "actions-inner",
              className:
                "mx-auto max-w-[1280px] px-[16px] sm:px-[24px] py-[10px] flex items-center gap-[8px] min-w-0 overflow-x-auto no-scrollbar",
              children:
                menuCategory &&
                jsx("div", {
                  id: "actions-chips",
                  className: "chip-row",
                  children: Object.entries(Z[menuCategory].actions).map(
                    ([key, actionDef]) => {
                      return jsxs(
                        "button",
                        {
                          onClick: () => {
                            chooseAction(menuCategory, key);
                            shellRef.current?.focus();
                          },
                          className: "chip chip-action rounded-[8px] border transition-all",
                          children: [
                            jsx("span", {
                              className:
                                "chip-key text-[12px] font-[800] font-mono px-[6px] h-[20px] rounded-[6px] flex items-center",
                              children: key.toUpperCase(),
                            }),
                            jsxs("span", {
                              className: "chip-caption text-[11px] font-[700]",
                              style: {
                                fontFamily: "Inter",
                              },
                              children: [
                                jsx("span", {
                                  className: "chip-label-short",
                                  children: shortWord(actionDef.label),
                                }),
                                jsx("span", {
                                  className: "chip-label-full",
                                  children: actionDef.label,
                                }),
                              ],
                            }),
                            actionDef.needsArg &&
                              jsx("span", {
                                className:
                                  "chip-arg text-[8px] px-[6px] h-[16px] rounded-full font-[800] uppercase tracking-[0.08em] bg-white/20 text-white",
                                children: "arg",
                              }),
                          ],
                        },
                        key,
                      );
                    },
                  ),
                }),
            }),
          }),
          !committedCategory &&
            jsx("div", {
            id: "categories",
            className:
              "app-categories shrink-0 z-20 border-t border-[#e2e8f0] bg-white/90 backdrop-blur-xl",
            children: jsxs("div", {
              id: "categories-inner",
              className:
                "mx-auto max-w-[1280px] px-[16px] sm:px-[24px] py-[10px] flex items-center gap-[8px] min-w-0 overflow-x-auto no-scrollbar",
              children: [
                jsx("div", {
                  id: "categories-chips",
                  className: "chip-row",
                  children: Object.keys(Z).map((item) => {
                    return jsxs(
                      "button",
                      {
                        "data-testid": `cat-${item}`,
                        onClick: () => {
                          chooseCategory(item);
                          setFlash(`cat-${item}`);
                          setTimeout(() => setFlash(null), 400);
                          shellRef.current?.focus();
                        },
                        className: "chip chip-category rounded-[8px] border transition-all",
                        style: {
                          background: Z[item].color,
                          borderColor: Z[item].color,
                        },
                        children: [
                          jsx("span", {
                            className: "chip-key text-[12px] font-[800] font-mono",
                            children: item.toUpperCase(),
                          }),
                          jsxs("span", {
                            className: "chip-caption text-[10px] font-[700]",
                            style: {
                              fontFamily: "Inter",
                            },
                            children: [
                              jsx("span", {
                                className: "chip-label-short",
                                children: shortWord(Z[item].label),
                              }),
                              jsx("span", {
                                className: "chip-label-full uppercase tracking-[0.08em]",
                                children: Z[item].label,
                              }),
                            ],
                          }),
                        ],
                      },
                      item,
                    );
                  }),
                }),
                !menuCategory &&
                  jsx("div", {
                    id: "categories-hint",
                    className: "cat-hint text-[11px] font-mono text-[#94a3b8] shrink-0",
                    children: "Press a category key",
                  }),
              ],
            }),
          }),
          jsx("div", {
            id: "cmdline",
            className:
              "app-footer shrink-0 z-20 backdrop-blur-xl bg-white/80 border-t border-[#e2e8f0]",
            children: jsxs("div", {
              id: "cmdline-inner",
              className:
                "mx-auto max-w-[1280px] px-[24px] h-[64px] flex items-center gap-[6px] min-w-0 overflow-x-auto no-scrollbar",
              children: [
                        jsxs("div", {
                          id: "field-cat",
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
                          id: "field-act",
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
                          id: "field-arg",
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
                        canGoWithoutArg &&
                          jsxs("button", {
                            id: "go-btn",
                            type: "button",
                            onMouseDown: (event) => event.preventDefault(),
                            onClick: () => {
                              execute();
                              shellRef.current?.focus();
                            },
                            className: "go-btn",
                            children: [
                              jsx("span", {
                                className: "go-btn-label",
                                children: "Go",
                              }),
                              jsx("kbd", {
                                className: "go-btn-key",
                                children: enterKeyGlyph,
                              }),
                              jsx("span", {
                                className: "go-btn-os",
                                children: enterKeyName,
                              }),
                            ],
                          }),
                        cmdlineHint &&
                          jsx("div", {
                            id: "cmdline-hint",
                            className: "cmdline-hint",
                            children: cmdlineHint,
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
