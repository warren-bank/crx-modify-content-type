$(function() {
  InitializeRules()

  $(".addButton").click(function() {
    $("#inputForm").show();
    $("#inputForm input")[0].focus()
  });
  $(".dlgAddButton").click(function() {
    var a = $("#inputForm input[type='text']"),
      b = $("#inputForm input[type='hidden']")[0];
    if (a[1].value && a[2].value && a[3].value) {
      a[0].value || (a[0].value =
        "<unnamed rule>");
      a[4].value || (a[4].value = "<unchanged>");
      if (b.value) {
        var c = $("#ruleList li")[parseInt(b.value)],
          b = $(c).find("h2"),
          c = $(c).find("td:last-child");
        $(b).text(a[0].value);
        $(c[0]).text(a[1].value);
        $(c[1]).text(a[2].value);
        $(c[2]).text(a[3].value);
        $(c[3]).text(a[4].value)
      } else DrawRule(a[0].value, a[1].value, a[2].value, a[3].value, a[4].value);
      $("#inputForm input[type='text']").val("");
      $("#inputForm input[type='hidden']").val("");
      $("#inputForm").hide();
      SaveRules()
    } else alert("Required fields missing!")
  });
  $(".dlgCancelButton").click(function() {
    $("#inputForm input[type='text']").val("");
    $("#inputForm input[type='hidden']").val("");
    $("#inputForm").hide()
  })

  $(".exportButton").click(ExportRules);
  $(".importButton").click(ImportRules);
  $(".removeAllRulesButton").click(RemoveAllRules);
});

function HTMLEncode(a) {
  return $("<div/>").text(a).html()
}

function DrawRule(name, urlRE, matchRE, replaceText, disposition, isValid) {
  const $li = $(`
<li>
  <h2>${ HTMLEncode(name) }</h2>
  <input class="editButton" type="button" value="Edit Rule" />
  <input class="removeButton" type="button" value="Remove Rule" />
  <table>
    <tr>
      <td>URL Filter:</td>
      <td>${ HTMLEncode(urlRE) }</td>
    </tr>
    <tr>
      <td>Original Type:</td>
      <td>${ HTMLEncode(matchRE) }</td>
    </tr>
    <tr>
      <td>Replacement Type:</td>
      <td>${ HTMLEncode(replaceText) }</td>
    </tr>
    <tr>
      <td>Disposition:</td>
      <td>${ HTMLEncode(disposition) }</td>
    </tr>
${
  (isValid) ? '' : `
    <tr>
      <td style="color: red">Error:</td>
      <td>Rule contains an invalid regex pattern</td>
    </tr>
`
}
  </table>
</li>
`)

  $li.find(".editButton").click(function() {
    var a = $(this).parent("li")[0],
      c = $(a).find("h2"),
      b = $(a).find("td:last-child"),
      d = $("#inputForm input[type='text']");
    d[0].value = $(c).text();
    d[1].value = $(b[0]).text();
    d[2].value = $(b[1]).text();
    d[3].value = $(b[2]).text();
    d[4].value = $(b[3]).text();
    c = $("#inputForm input[type='hidden']")[0];
    b = $(a).parent().children();
    c.value = b.index(a);
    $(".addButton")[0].click()
  });
  $li.find(".removeButton").click(function() {
    var a = $(this).parents("li"),
      b = $(a).find("h2");
    confirm('Rule "' + $(b).text() + '" will be deleted!') && (a.remove(), SaveRules())
  });
  $li.appendTo("#ruleList")
}

function SaveRules() {
  var a = [];
  $.each($("#ruleList li"), function(e, b) {
    var c = $(b).find("h2"),
      d = $(b).find("td:last-child");
    a.push({
      name: $(c).text(),
      urlRE: $(d[0]).text(),
      matchRE: $(d[1]).text(),
      replaceText: $(d[2]).text(),
      disposition: $(d[3]).text()
    })
  });
  console.log("save", a);

  SaveChangedRules(a)
};

function SaveChangedRules(rules) {
  chrome.extension.sendMessage({
    type: "rules_changed",
    data: rules
  });

  setTimeout(() => location.reload(), 250)
}

function InitializeRules() {
  chrome.extension.sendMessage({
    type: "get_rules"
  },
  (rules) => {
    if (chrome.runtime.lastError) {
      console.log('chrome.runtime.lastError:', chrome.runtime.lastError)
      return
    }
    if (!rules || !Array.isArray(rules) || !rules.length) {
      console.log('no rules read from background script')
      return
    }

    let rule
    for (let i=0; i < rules.length; i++) {
      rule = rules[i]
      DrawRule(rule.name, rule.urlRE, rule.matchRE, rule.replaceText, rule.disposition, rule.isValid)
    }

    window.ModifyContentTypeRules = rules
  });
}

function ExportRules() {
  if (window.ModifyContentTypeRules) {
    const json = JSON.stringify(window.ModifyContentTypeRules, null, 2)

    const blob     = new Blob([json], {type: 'octet/stream'})
    const filename = 'full_export.json'
    const url      = window.URL.createObjectURL(blob)
    const anchor   = document.createElement('a')
    anchor.setAttribute('href', url)
    anchor.setAttribute('download', filename)
    anchor.click()
  }
}

function ImportRules() {
  const input = document.createElement('input')
  input.setAttribute('type',   'file')
  input.setAttribute('accept', 'text/plain, application/json, .txt, .json')
  input.addEventListener('change', (event) => {
    const files = event.target.files

    if (files.length) {
      const reader = new FileReader()
      reader.onload = function(){
        const json = reader.result
        try {
          const rules = JSON.parse(json)
          SaveChangedRules(rules)
        }
        catch(error) {
          alert('Import Failed: File does not contain well-formatted JSON')
        }
      }
      reader.readAsText(files[0])
    }
  })
  input.click()
}

function RemoveAllRules() {
  const rules = []
  SaveChangedRules(rules)
}
