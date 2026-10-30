(function () {
  var form = document.getElementById("terminal-form");
  var input = document.getElementById("terminal-input");
  var output = document.getElementById("terminal-output");
  var cvPath = "Ryan_Shi_Ding_CV_2026.pdf";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function randomCharacter() {
    var characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=<>?/";
    return characters[Math.floor(Math.random() * characters.length)];
  }

  function scramble(text, revealed) {
    return Array.from(text, function (character, index) {
      return index < revealed || /\s/.test(character) ? character : randomCharacter();
    }).join("");
  }

  function animateHeading(element) {
    var text = element.dataset.scrambleText;
    var duration = Math.min(700 + text.length * 10, 1500);
    var start = performance.now();
    var lastUpdate = 0;
    var scrambled = scramble(text, 0);

    element.style.minHeight = element.offsetHeight + "px";
    element.classList.add("scr");

    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var revealed = Math.floor(progress * text.length);

      if (progress < 1) {
        if (now - lastUpdate >= 100) {
          scrambled = scramble(text, revealed);
          lastUpdate = now;
        }
        element.textContent = scrambled;
        requestAnimationFrame(tick);
      } else {
        element.textContent = text;
        element.classList.remove("scr");
        element.style.minHeight = "";
      }
    }

    requestAnimationFrame(tick);
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    var headingObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          headingObserver.unobserve(entry.target);
          animateHeading(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll(
      "main h1, main h2, main h3, main h4, main section:not(.terminal) p, main section:not(.terminal) a, main section:not(.terminal) li, main section:not(.terminal) span, main nav a, main nav button, main footer"
    ).forEach(function (element) {
      if (element.children.length || !element.textContent.trim()) return;
      element.dataset.scrambleText = element.textContent;
      element.textContent = scramble(element.dataset.scrambleText, 0);
      headingObserver.observe(element);
    });
  }

  var downloadCvButton = document.getElementById("download-cv-button");
  var cvCommandInProgress = false;

  if (form && input && output) {
    var suggestion = document.getElementById("terminal-suggestion");
    var commandNames = ["whois", "grep", "curl", "clear", "help", "man"];
    var pageKeywords;
    var commandHistory = [];
    var historyIndex = 0;
    var historyDraft = "";

    function forEachSearchableText(callback) {
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (textNode) {
          var parent = textNode.parentElement;
          if (!parent || !textNode.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (parent.closest(".terminal, script, style, noscript, template, [hidden], [aria-hidden='true']")) {
            return NodeFilter.FILTER_REJECT;
          }
          var style = window.getComputedStyle(parent);
          return style.display === "none" || style.visibility === "hidden" || !parent.getClientRects().length
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        }
      });
      var textNode;
      while ((textNode = walker.nextNode())) {
        var parent = textNode.parentElement;
        callback(parent.dataset.scrambleText || textNode.nodeValue, parent);
      }
    }

    function keywordsOnPage() {
      if (pageKeywords) return pageKeywords;
      var seen = Object.create(null);
      pageKeywords = [];
      forEachSearchableText(function (text) {
        var words = text.match(/[A-Za-z0-9À-ÿ]+(?:['’-][A-Za-z0-9À-ÿ]+)*/g) || [];
        words.forEach(function (word) {
          var key = word.toLowerCase();
          if (!seen[key]) {
            seen[key] = true;
            pageKeywords.push(word);
          }
        });
      });
      return pageKeywords;
    }

    function completionFor(value) {
      var trailingSpace = /\s$/.test(value);
      var tokens = value.match(/\S+/g) || [];
      var current = trailingSpace ? "" : (tokens.pop() || "");
      var previous = tokens;
      var candidates = [];
      var command = (previous[0] || "").toLowerCase();

      if (!previous.length) {
        candidates = commandNames;
      } else if (command === "whois" && previous.length === 1 && previous[1] !== "--help") {
        candidates = ["ryan", "ryanshiding", "--help"];
      } else if (command === "grep") {
        var grepArgs = previous.slice(1);
        if (!grepArgs.length) {
          candidates = current ? keywordsOnPage().concat(["-i", "--help"]) : ["-i", "--help"];
        } else if (current && grepArgs[0] !== "--help") {
          candidates = keywordsOnPage();
        }
      } else if (command === "curl" && previous.length === 1) {
        candidates = ["-O", "--help"];
      } else if (command === "curl" && previous.length === 2 && previous[1] === "-O") {
        candidates = [cvPath, "cv.pdf"];
      } else if (command === "man" && previous.length === 1) {
        candidates = ["-k", "--help"];
      } else if (command === "man" && previous.length === 2 && previous[1] === "-k") {
        candidates = ["."];
      } else if ((command === "clear" || command === "help") && previous.length === 1) {
        candidates = ["--help"];
      }

      var match = candidates.find(function (candidate) {
        return candidate.toLowerCase().indexOf(current.toLowerCase()) === 0;
      });
      return match && match.length > current.length ? match.slice(current.length) : "";
    }

    function updateSuggestion() {
      var completion = input.value && input.selectionStart === input.value.length
        ? completionFor(input.value)
        : "";
      suggestion.textContent = completion;
      suggestion.style.left = input.value.length + "ch";
    }

    input.addEventListener("input", updateSuggestion);
    input.addEventListener("click", updateSuggestion);
    input.addEventListener("keyup", updateSuggestion);
    input.addEventListener("keydown", function (event) {
      if (event.key === " " && input.selectionStart === input.selectionEnd &&
          input.value.charAt(input.selectionStart - 1) === " ") {
        event.preventDefault();
        input.setRangeText(" ", input.selectionStart, input.selectionEnd, "end");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      if (event.key === "ArrowUp") {
        if (!commandHistory.length) return;
        event.preventDefault();
        if (historyIndex === commandHistory.length) historyDraft = input.value;
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = commandHistory[historyIndex];
        updateSuggestion();
        return;
      }
      if (event.key === "ArrowDown" && historyIndex < commandHistory.length) {
        event.preventDefault();
        historyIndex += 1;
        input.value = historyIndex === commandHistory.length ? historyDraft : commandHistory[historyIndex];
        updateSuggestion();
        return;
      }
      if (event.key !== "Tab") return;
      var completion = completionFor(input.value);
      if (!completion) return;
      event.preventDefault();
      input.value += completion + " ";
      updateSuggestion();
    });
    updateSuggestion();

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (cvCommandInProgress) return;
      var command = input.value.trim();
      var parts = command.match(/"[^"]*"|'[^']*'|\S+/g) || [];
      var name = (parts.shift() || "").toLowerCase();
      var args = parts.map(function (part) {
        return part.replace(/^["']|["']$/g, "");
      });
      var argument = args.join(" ");
      var result = document.createElement("p");
      result.className = "terminal-result";
      var grepTarget = null;
      var manuals = {
        whois: "whois - look up Ryan's profile\nUsage: whois <domain>\nUse 'whois ryan' or 'whois ryanshiding' to display Ryan Shi Ding's profile. Other names return a lookup error.",
        grep: "grep - search this portfolio for text\nUsage: grep [ -i ] <search term>\nSearches visible page text and jumps to the first match. Matching is case-insensitive; -i is accepted for familiar grep syntax. Press Tab after a partial keyword to complete it from page text.",
        curl: "curl - download the CV\nUsage: curl -O <filename>\nUse 'curl -O " + cvPath + "' or 'curl -O cv.pdf' to download the CV PDF bundled with this website.",
        clear: "clear - clear the terminal output\nUsage: clear\nRemoves previous command output from this page's terminal. It does not change website content.",
        help: "help - list available website terminal commands\nUsage: help\nPrints a short command list. Use '<command> --help' for a command-specific manual.",
        man: "man - show command manuals or search the manual index\nUsage: man -k .\nLists every command available in this website terminal. Use '<command> --help' to read a command's instructions."
      };

      if (!name) return;

      commandHistory.push(command);
      historyIndex = commandHistory.length;
      historyDraft = "";

      if (args.length === 1 && args[0] === "--help" && manuals[name]) {
        result.textContent = manuals[name];
      } else if (name === "whois") {
        if (args.length === 0) {
          result.textContent = "whois: missing operand\nUsage: whois <domain>";
        } else if (args.length > 1) {
          result.textContent = "whois: extra operand '" + args[1] + "'\nUsage: whois <domain>";
        } else if (args[0].toLowerCase() === "ryan" || args[0].toLowerCase() === "ryanshiding") {
          result.textContent = "Ryan Shi Ding — Computer Science student at Linnaeus University in Växjö, Sweden.";
        } else {
          result.textContent = "getaddrinfo: " + args[0] + ": Name or service not known";
        }
      } else if (name === "help") {
        if (args.length) {
          result.textContent = "help: unexpected argument '" + args[0] + "'\nTry 'help --help' for more information.";
        } else {
          result.textContent = "Commands: whois <domain>, grep <search term>, curl -O <filename>, clear, help, man -k .\nUse '<command> --help' for instructions.";
        }
      } else if (name === "grep") {
        var pattern = args[0] === "-i" ? args.slice(1).join(" ") : argument;
        if (!pattern) {
          result.textContent = "grep: missing operand\nTry 'grep --help' for more information.";
        } else if (args.some(function (arg) { return arg.charAt(0) === "-" && arg !== "-i"; })) {
          result.textContent = "grep: invalid option -- '" + args.filter(function (arg) {
            return arg.charAt(0) === "-" && arg !== "-i";
          })[0].charAt(1) + "'\nTry 'grep --help' for more information.";
        } else {
          try {
            var matches = [];
            forEachSearchableText(function (text, parent) {
              if (text.toLowerCase().indexOf(pattern.toLowerCase()) !== -1) {
                matches.push({ text: text.trim(), target: parent });
              }
            });

            if (matches.length) {
              grepTarget = matches[0].target;
              result.textContent = "grep: found '" + pattern + "' in " + matches.length +
                " place(s); jumping to first match:\n" + matches[0].text;
            } else {
              result.textContent = "grep: pattern not found: '" + pattern + "'";
            }
          } catch (error) {
            result.textContent = "grep: search failed: " +
              (error && error.message ? error.message : "unexpected error") +
              "\nTry 'grep --help' for more information.";
          }
        }
      } else if (name === "curl") {
        var target = args[args.length - 1] || "";
        var hasOutputFlag = args[0] === "-O";
        if (hasOutputFlag && args.length === 1) {
          result.textContent = "curl: option -O: requires parameter";
        } else if (hasOutputFlag && (target === cvPath || target === "cv.pdf") && args.length === 2) {
          var link = document.createElement("a");
          link.href = cvPath;
          link.download = cvPath;
          document.body.appendChild(link);
          link.click();
          link.remove();
          result.textContent = "Downloading " + cvPath;
        } else if (args.length === 0) {
          result.textContent = "curl: try 'curl --help' or 'curl --manual' for more information";
        } else if (hasOutputFlag) {
          result.textContent = "curl: (3) URL rejected: " + target;
        } else {
          result.textContent = "curl: try 'curl --help' or 'curl --manual' for more information";
        }
      } else if (name === "clear") {
        if (args.length) {
          result.textContent = "clear: unexpected argument '" + args[0] + "'\nTry 'clear --help' for more information.";
        } else {
          output.replaceChildren();
          input.value = "";
          updateSuggestion();
          return;
        }
      } else if (name === "man") {
        if (args.length === 2 && args[0] === "-k" && args[1] === ".") {
          result.textContent = [
            "clear (1) - clear terminal output",
            "curl (1) - download the CV PDF",
            "grep (1) - search portfolio text",
            "help (1) - list available commands",
            "man (1) - display this manual index",
            "whois (1) - look up Ryan's profile by name"
          ].join("\n");
        } else {
          result.textContent = "man: usage: man -k .\nTry 'man --help' for more information.";
        }
      } else {
        result.textContent = "bash: " + name + ": command not found";
      }

      var entry = document.createElement("p");
      entry.className = "terminal-entry";
      entry.textContent = "root@kali:~$ " + command;
      output.append(entry, result);
      input.value = "";
      updateSuggestion();
      input.focus(grepTarget ? { preventScroll: true } : undefined);
      if (grepTarget) {
        try {
          grepTarget.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        } catch (error) {
          result.textContent = "grep: could not navigate to match: " +
            (error && error.message ? error.message : "unexpected error");
        }
      }
    });

    if (downloadCvButton) {
      downloadCvButton.addEventListener("click", function () {
        if (cvCommandInProgress) return;
        var command = "curl -O " + cvPath;
        var index = 0;
        cvCommandInProgress = true;
        downloadCvButton.disabled = true;
        downloadCvButton.setAttribute("aria-busy", "true");
        input.value = "";
        input.readOnly = true;
        input.focus();

        function typeNextCharacter() {
          input.value += command.charAt(index);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          index += 1;

          if (index < command.length) {
            window.setTimeout(typeNextCharacter, reduceMotion ? 0 : 90);
            return;
          }

          input.readOnly = false;
          cvCommandInProgress = false;
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          downloadCvButton.disabled = false;
          downloadCvButton.removeAttribute("aria-busy");
        }

        typeNextCharacter();
      });
    }
  }

  document.querySelectorAll("[data-go]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var target = document.getElementById(link.dataset.go);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
})();
