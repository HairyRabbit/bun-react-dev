const common_style = ['padding:0 4px', 'border-radius:2px']

const enum LoggerLevel {
  Error,
  Warning,
  Info,
}

type LoggerOptions = {
  level?: LoggerLevel
  datetime?: string | null
}

const DefaultLoggerOptions: Required<LoggerOptions> = {
  level: LoggerLevel.Info,
  datetime: null,
}

const default_logger = create_logger()
export const { warn, info, error } = default_logger

export function create_logger(options: LoggerOptions = {}) {
  function log(level: LoggerLevel) {
    return (action: string, ...msg: any[]) => {
      const { style, tag, func } = get_logger_level_options(level)
      let flag = ''
      if (options.datetime) flag += `[${format_datetime(new Date())}] `
      flag += tag
      if (action) flag += ':' + action

      return func.apply(console, [
        `%c${flag}%c`,
        [...style, ...common_style].join(';'),
        '',
        ...msg
      ])
    }
  }

  return {
    info: log(LoggerLevel.Info),
    warn: log(LoggerLevel.Warning),
    error: log(LoggerLevel.Error),
  }
}

function format_datetime(date: Date) {
  const hh = date.getHours()
  const mm = date.getMinutes()
  const ss = date.getSeconds()
  return `${hh}:${mm}:${ss}`
}

function get_logger_level_options(level: LoggerLevel) {
  switch (level) {
    case LoggerLevel.Info: {
      return {
        func: console.log,
        tag: 'info',
        style: ['background:blue', 'color:white']
      }
    }
    case LoggerLevel.Warning: {
      return {
        func: console.warn,
        tag: 'warning',
        style: ['background:orange', 'color:black']
      }
    }
    case LoggerLevel.Error: {
      return {
        func: console.error,
        tag: 'error',
        style: ['background:red', 'color:white']
      }
    }
  }
}