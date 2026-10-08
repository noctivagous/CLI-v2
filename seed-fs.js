var D0 = {
  type: "dir",
  children: {
    Desktop: {
      type: "dir",
      children: {
        "screenshot.png": {
          type: "file",
          content: "",
        },
      },
    },
    Documents: {
      type: "dir",
      children: {
        "notes.txt": {
          type: "file",
          content: "TODO:\n- blend graphics + keyboard\n- keep baseline grid\n- commit with space",
        },
        "todo.md": {
          type: "file",
          content: "- [x] build v2\n- [ ] ship",
        },
        "resume.md": {
          type: "file",
          content: "# Resume\n\nCategory CLI — graphical + keyboard hybrid.",
        },
      },
    },
    Downloads: {
      type: "dir",
      children: {
        "archive.tar.gz": {
          type: "file",
          content: "",
        },
      },
    },
    Pictures: {
      type: "dir",
      children: {},
    },
    Projects: {
      type: "dir",
      children: {
        cli: {
          type: "dir",
          children: {
            "readme.md": {
              type: "file",
              content: "# CLI\n\nv1 notes",
            },
            "src": {
              type: "dir",
              children: {
                "index.ts": {
                  type: "file",
                  content: "// entry\nconsole.log(\"hello\")",
                },
              },
            },
          },
        },
        site: {
          type: "dir",
          children: {},
        },
      },
    },
    ".bashrc": {
      type: "file",
      content: "export PATH=$PATH\nalias ll='ls -la'\n",
    },
    ".profile": {
      type: "file",
      content: "",
    },
  },
};
