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
        "variants": [
          "empty folder",
          "with .gitkeep",
          "nested path"
        ]
      },
      "n": {
        "label": "navigate",
        "desc": "Navigate directory",
        "needsArg": true,
        "suggest": "dirs",
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
    "color": "#7c3aed",
    "actions": {
      "v": {
        "label": "view",
        "desc": "Open file",
        "needsArg": true,
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
        "variants": [
          "append text",
          "overwrite"
        ]
      },
      "n": {
        "label": "new",
        "desc": "Create file",
        "needsArg": true,
        "variants": [
          "empty",
          "from template"
        ]
      },
      "d": {
        "label": "delete",
        "desc": "Remove file",
        "needsArg": true,
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
        "variants": [
          "clear log",
          "clear + reset fs"
        ]
      },
      "h": {
        "label": "help",
        "desc": "Show help",
        "needsArg": false,
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
        "variants": [
          "all categories",
          "current category"
        ]
      },
      "c": {
        "label": "cats",
        "desc": "Show categories",
        "needsArg": false,
        "variants": [
          "grid",
          "list"
        ]
      }
    }
  }
};
