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

    document.querySelectorAll("h1, h2, h3, h4").forEach(function (heading) {
      if (heading.children.length || !heading.textContent.trim()) return;
      heading.dataset.scrambleText = heading.textContent;
      heading.textContent = scramble(heading.dataset.scrambleText, 0);
      headingObserver.observe(heading);
    });
  }

  if (form && input && output) {
    var suggestion = document.getElementById("terminal-suggestion");
    var commandNames = ["whois", "grep", "curl", "clear", "help", "man"];

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
      } else if (command === "grep" && previous.length === 1) {
        candidates = ["--help"];
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
      var command = input.value.trim();
      var parts = command.match(/"[^"]*"|'[^']*'|\S+/g) || [];
      var name = (parts.shift() || "").toLowerCase();
      var args = parts.map(function (part) {
        return part.replace(/^["']|["']$/g, "");
      });
      var argument = args.join(" ");
      var result = document.createElement("p");
      result.className = "terminal-result";
      var manuals = {
        whois: "whois - look up Ryan's profile\nUsage: whois <domain>\nUse 'whois ryan' or 'whois ryanshiding' to display Ryan Shi Ding's profile. Other names return a lookup error.",
        grep: "grep - search this portfolio for text\nUsage: grep [ -i ] <search term>\nSearches visible portfolio headings, descriptions, skills, experience, and contact text. Matching is case-insensitive; -i is accepted for familiar grep syntax.",
        curl: "curl - download the CV\nUsage: curl -O <filename>\nUse 'curl -O " + cvPath + "' or 'curl -O cv.pdf' to download the CV PDF bundled with this website.",
        clear: "clear - clear the terminal output\nUsage: clear\nRemoves previous command output from this page's terminal. It does not change website content.",
        help: "help - list available website terminal commands\nUsage: help\nPrints a short command list. Use '<command> --help' for a command-specific manual.",
        man: "man - show command manuals or search the manual index\nUsage: man -k .\nLists every command available in this website terminal. Use '<command> --help' to read a command's instructions."
      };

      if (!name) return;

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
          var matches = [];
          document.querySelectorAll(
            "main h1, main h2, main h3, main h4, main section:not(.terminal) p, main li, main .chips span, main footer"
          ).forEach(function (element) {
            var text = element.textContent.trim();
            if (text && text.toLowerCase().indexOf(pattern.toLowerCase()) !== -1) {
              matches.push(text);
            }
          });
          result.textContent = matches.length ? matches.join("\n") : "";
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
      input.focus();
    });
  }

  document.querySelectorAll("[data-go]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var target = document.getElementById(link.dataset.go);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
})();
