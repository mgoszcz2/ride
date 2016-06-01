D.modules.cmds=function(require){'use strict'

// This is the list of command-to-keystroke mappings that are configurable in Preferences>Keys.
// The list does not necessarily contain all commands and all keystrokes in RIDE, only those in Preferences>Keys.
this.cmds=[
  //code description                defaults                 important? (shown in lbar's kbd btn tooltip)
  ['ABT','About',                   ['Shift-F1']],
  ['AC', 'Align comments',          []],
  ['AO', 'Add comments',            []],
  ['BK', 'Backward or Undo',        ['Shift-Ctrl-Backspace'],1],
  ['BP', 'Toggle breakpoint',       []],
  ['BT', 'Back Tab between windows',['Shift-Ctrl-Tab'],      1],
  ['CNC','Connect',                 []],
  ['DMK','Toggle key display mode', []],
  ['DMN','Next line in demo',       []],
  ['DMP','Previous line in demo',   []],
  ['DMR','Load demo file',          []],
  ['DO', 'Delete comments',         []],
  ['ED', 'Edit',                    ['Shift-Enter'],         1],
  ['EP', 'Exit (and save changes)', ['Esc'],                 1],
  ['ER', 'Execute line',            ['Enter']],
  ['EXP','Expand selection',        ['Shift-Alt-Up']],
  ['FD', 'Forward or Redo',         ['Shift-Ctrl-Enter'],    1],
  ['FX', 'Fix the current function',[]],
  ['HLP','Help',                    ['F1']],
  ['JBK','Jump back',               ['Shift-Ctrl-J']],
  ['JSC','Show JavaScript console', ['F12']],
  ['LBR','Toggle language bar',     []],
  ['LN', 'Toggle line numbers',     []],
  ['LOG','Show RIDE protocol log',  ['Ctrl-F12']],
  ['MA', 'Continue execution of all threads',[]],
  ['MNU','Open menu',               ['F10']],
  ['NEW','New session',             ['Ctrl-N']],
  ['PRF','Show preferences',        []],
  ['QIT','Quit',                    ['Ctrl-Q']],
  ['QT', 'Quit (and lose changes)', ['Shift-Esc'],           1],
  ['RD', 'Reformat',                []],
  ['RP', 'Replace (in editors)',    [],                      1],
  ['SC', 'Search (in editors)',     [],                      1],
  ['SI', 'Strong interrupt',        []],
  ['TB', 'Tab between windows',     ['Ctrl-Tab'],            1],
  ['TC', 'Trace',                   ['Ctrl-Enter'],          1],
  ['TGC','Toggle comment',          []],
  ['TIP','Show value tip',          []],
  ['TL', 'Toggle localisation',     ['Ctrl-Up'],             1],
  ['TO', 'Toggle fold',             []],
  ['VAL','Evaluate selection or name under cursor',[]],
  ['WI', 'Weak interrupt',          ['Ctrl-Pause']],
  ['WSE','Toggle workspace explorer',[]],
  ['ZMI','Increase font size',      ['Ctrl-=','Shift-Ctrl-='].concat(D.mac?['Cmd-=','Shift-Cmd-=']:[])],
  ['ZMO','Decrease font size',      ['Ctrl--'].concat(D.mac?'Cmd--':[])],
  ['ZMR','Reset font size',         ['Ctrl-0'].concat(D.mac?'Cmd-0':[])]
]

}
