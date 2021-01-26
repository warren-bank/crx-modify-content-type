const debug = false
const localStorageKey = 'rules'

let rules = []  // {urlRE, matchRE, replaceText, disposition, isValid}

const preprocess_serialized_rules = () => {
  let index, rule
  for (index = 0; index < rules.length; index++) {
    rule = rules[index]

    try {
      rule.urlRE   = RegExp(rule.urlRE)
      rule.matchRE = RegExp(rule.matchRE)
      rule.isValid = true
    }
    catch(error) {
      rule.isValid = false
    }
  }
}

const read_serialized_rules_from_storage = (callback) => {
  const callbackWrapper = (typeof callback !== 'function')
    ? null
    : (result) => {
        const serialized_rules = result ? result[localStorageKey] : null
        callback( serialized_rules )
      }

  chrome.storage.local.get([localStorageKey], callbackWrapper)
}

const init_background_rules = () => {
  const callback = (serialized_rules) => {
    if (serialized_rules) {
      try {
        rules = JSON.parse( serialized_rules )
        preprocess_serialized_rules()
      }
      catch(error) {}
    }
  }

  read_serialized_rules_from_storage(callback)
}

const write_serialized_rules_to_storage = (serialized_rules, callback) => {
  chrome.storage.local.set({[localStorageKey]: serialized_rules}, callback)
}

chrome.webRequest.onHeadersReceived.addListener(details => {
  const matching_rule_indexes = []
  let index, rule

  for (index = 0; index < rules.length; index++) {
    rule = rules[index]

    if (rule.isValid && rule.urlRE.test(details.url)) {
      matching_rule_indexes.push(index)
    }
  }

  if (matching_rule_indexes.length) {
    let header_index_content_type        = -1
    let header_index_content_disposition = -1
    let header_name, header_value, rule_index

    for (index = 0; index < details.responseHeaders.length; index++) {
      header_name = details.responseHeaders[index].name.toLowerCase()

      switch(header_name) {
        case 'content-type':
          header_index_content_type = index
          break
        case 'content-disposition':
          header_index_content_disposition = index
          break
      }
    }

    if (header_index_content_type >=0) {
      for (index = 0; index < matching_rule_indexes.length; index++) {
        header_value = details.responseHeaders[ header_index_content_type ].value
        rule_index   = matching_rule_indexes[index]
        rule         = rules[rule_index]

        if (rule.matchRE.test(header_value)) {
          if (rule.replaceText) {
            debug && console.log('modified content-type header', header_value, rule.replaceText)

            details.responseHeaders[ header_index_content_type ].value = rule.replaceText
          }

          if (rule.disposition) {
            switch(rule.disposition) {
              case '<unchanged>':
                debug && console.log('disposition is unchanged')
                break
              case '<remove>':
                debug && console.log('disposition is removed')
                if (header_index_content_disposition >=0) {
                  details.responseHeaders.splice(header_index_content_disposition, 1)
                }
                break
              default:
                if (header_index_content_disposition >=0) {
                  if (debug) {
                    header_value = details.responseHeaders[ header_index_content_disposition ].value
                    console.log('modified content-disposition header', header_value, rule.disposition)
                  }

                  details.responseHeaders[ header_index_content_disposition ].value = rule.disposition
                }
                else {
                  debug && console.log('added content-disposition header', rule.disposition)

                  details.responseHeaders.push({
                    name:  'content-disposition',
                    value: rule.disposition
                  })
                }
                break
            }
          }
        }
      }
    }
  }

  return {responseHeaders: details.responseHeaders}
}, {
  urls:  ["<all_urls>"],
  types: ["main_frame", "sub_frame"]
}, ["blocking", "responseHeaders"])

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message) {
    debug && console.log('message received of type:', message.type)

    switch(message.type) {
      case 'rules_changed':
        if (Array.isArray(message.data)) {
          write_serialized_rules_to_storage( JSON.stringify(message.data) )

          rules = message.data
          preprocess_serialized_rules()
        }
        break
      case 'get_rules':
        sendResponse(rules.map(rule => ({
          ...rule,
          urlRE:   (rule.urlRE   instanceof RegExp) ? rule.urlRE.source   : rule.urlRE,
          matchRE: (rule.matchRE instanceof RegExp) ? rule.matchRE.source : rule.matchRE
        })))
        break
    }
  }
})

init_background_rules()
