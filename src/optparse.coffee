# Create an OptionParser with a list of valid options, in the form:
#   [short-flag (optional), long-flag, description]
# And an optional banner for the usage help.
exports.OptionParser: class OptionParser

  constructor: (rules, banner) ->
    @banner:  banner
    @rules:   build_rules(rules)

  # Parse the argument array, populating an options object with all of the
  # specified options, and returning it. options.arguments will be an array
  # containing the remaning non-option arguments.
  parse: (args) ->
    options: {arguments: []}
    args: normalize_arguments args
    while arg: args.shift()
      is_option: !!(arg.match(LONG_FLAG) or arg.match(SHORT_FLAG))
      matched_rule: no
      for rule in @rules
        if rule.letter is arg or rule.flag is arg
          options[rule.name]: if rule.has_argument then args.shift() else true
          matched_rule: yes
          break
      throw new Error "unrecognized option: $arg" if is_option and not matched_rule
      options.arguments.push arg unless is_option
    options

  # Return the help text for this OptionParser, for --help and such.
  help: ->
    lines: ['Available options:']
    lines.unshift "$@banner\n" if @banner
    for rule in @rules
      spaces:   15 - rule.flag.length
      spaces:   if spaces > 0 then (' ' for i in [0..spaces]).join('') else ''
      let_part: if rule.letter then rule.letter + ', ' else '    '
      lines.push "  $let_part${rule.flag}$spaces${rule.description}"
    "\n${ lines.join('\n') }\n"

# Regex matchers for option flags.
LONG_FLAG:  /^(--\w[\w\-]+)/
SHORT_FLAG: /^(-\w)/
MULTI_FLAG: /^-(\w{2,})/
OPTIONAL:   /\[(.+)\]/

# Build rules from a list of valid switch tuples in the form:
# [letter-flag, long-flag, help], or [long-flag, help].
build_rules: (rules) ->
  for tuple in rules
    tuple.unshift null if tuple.length < 3
    build_rule tuple...

# Build a rule from a short-letter-flag, long-form-flag, and help text.
build_rule: (letter, flag, description) ->
  match: flag.match(OPTIONAL)
  flag:  flag.match(LONG_FLAG)[1]
  {
    name:         flag.substr 2
    letter:       letter
    flag:         flag
    description:  description
    has_argument: !!(match and match[1])
  }

# Normalize arguments by expanding merged flags into multiple flags.
normalize_arguments: (args) ->
  args: args.slice 0
  result: []
  for arg in args
    if match: arg.match MULTI_FLAG
      result.push '-' + l for l in match[1].split ''
    else
      result.push arg
  result
