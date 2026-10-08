(function () {
  function markExternal(anchor) {
    var href = anchor.getAttribute("href");
    if (!href) return;
    try {
      var url = new URL(href, document.baseURI);
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.host !== location.host
      ) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
    } catch (error) {}
  }

  function scan() {
    document.querySelectorAll("a[href]").forEach(markExternal);
  }

  if (document.readyState !== "loading") {
    scan();
  } else {
    document.addEventListener("DOMContentLoaded", scan);
  }

  document.addEventListener(
    "click",
    function (event) {
      var anchor =
        event.target && event.target.closest && event.target.closest("a[href]");
      if (anchor) {
        markExternal(anchor);
      }
    },
    true,
  );
})();
