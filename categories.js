var Z = {
  "d": {
    "label": "directory",
    "full": "DIRECTORY",
    "color": "#2563eb",
    "actions": {
      "l": {
        "label": "list",
        "desc": "List contents",
        "needsArg": false,
        "goHint": "press {enter} to list",
        "variants": [
          "list all",
          "files only",
          "tree view"
        ]
      },
      "m": {
        "label": "make",
        "desc": "Create new folder",
        "needsArg": true,
        "argHint": "type folder name",
        "variants": []
      },
      "n": {
        "label": "navigate",
        "desc": "Navigate directory",
        "needsArg": true,
        "suggest": "dirs",
        "argHint": "type or pick a folder",
        "variants": [
          "to child",
          "to parent ..",
          "to root /"
        ]
      },
      "r": {
        "label": "remove",
        "desc": "Delete folder",
        "needsArg": true,
        "argHint": "type folder name",
        "variants": [
          "soft delete",
          "force recursive"
        ]
      },
      "e": {
        "label": "rename",
        "desc": "Rename folder",
        "needsArg": true,
        "suggest": "child-dirs",
        "argHint": "type old name then new name",
        "variants": [
          "old new",
          "unique prefix"
        ]
      },
    }
  },
  "f": {
    "label": "file",
    "full": "FILE",
    "color": "#0891b2",
    "actions": {
      "v": {
        "label": "view",
        "desc": "Open file",
        "needsArg": true,
        "argHint": "type filename",
        "variants": [
          "preview",
          "raw",
          "with line numbers"
        ]
      },
      "e": {
        "label": "edit",
        "desc": "Edit contents",
        "needsArg": true,
        "argHint": "type filename",
        "variants": [
          "append text",
          "overwrite"
        ]
      },
      "n": {
        "label": "new",
        "desc": "Create file",
        "needsArg": true,
        "argHint": "type filename",
        "variants": [
          "empty",
          "from template"
        ]
      },
      "d": {
        "label": "delete",
        "desc": "Remove file",
        "needsArg": true,
        "argHint": "type filename",
        "variants": [
          "soft",
          "permanent"
        ]
      }
    }
  },
  "p": {
    "label": "program",
    "full": "PROGRAM",
    "color": "#db2777",
    "actions": {
      "x": {
        "label": "execute",
        "desc": "Launch a program",
        "needsArg": true,
        "suggest": "programs",
        "argHint": "type a program name",
        "variants": [
          "foreground",
          "background",
          "with args"
        ]
      },
      "l": {
        "label": "list",
        "desc": "List programs",
        "needsArg": false,
        "goHint": "press {enter} to list",
        "variants": [
          "all programs",
          "recent",
          "by name"
        ]
      }
    }
  },
  "s": {
    "label": "system",
    "full": "SYSTEM",
    "color": "#059669",
    "actions": {
      "i": {
        "label": "info",
        "desc": "System info",
        "needsArg": false,
        "goHint": "press {enter} to run",
        "variants": [
          "os + shell",
          "memory",
          "uptime"
        ]
      },
      "c": {
        "label": "clear",
        "desc": "Clear history",
        "needsArg": false,
        "goHint": "press {enter} to run",
        "variants": [
          "clear log",
          "clear + reset fs"
        ]
      },
      "h": {
        "label": "help",
        "desc": "Show help",
        "needsArg": false,
        "goHint": "press {enter} to run",
        "variants": [
          "short",
          "verbose"
        ]
      }
    }
  },
  "h": {
    "label": "help",
    "full": "HELP",
    "color": "#d97706",
    "actions": {
      "l": {
        "label": "list",
        "desc": "List commands",
        "needsArg": false,
        "goHint": "press {enter} to list",
        "variants": [
          "all categories",
          "current category"
        ]
      },
      "c": {
        "label": "cats",
        "desc": "Show categories",
        "needsArg": false,
        "goHint": "press {enter} to run",
        "variants": [
          "grid",
          "list"
        ]
      }
    }
  }
};
