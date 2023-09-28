import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from "source-map-js"

export function compose_sourcemap(origin: RawSourceMap, target: RawSourceMap) {
  const generator = new SourceMapGenerator()
  const origin_consumer = new SourceMapConsumer(origin)
  const target_consumer = new SourceMapConsumer(target)

  const consumers = [origin_consumer, target_consumer]

  target_consumer.eachMapping(mapping => {
    if (mapping.originalLine == null) return

    var origin_position = origin_consumer.originalPositionFor({
      line: mapping.originalLine,
      column: mapping.originalColumn
    })

    if (origin_position.source == null) return

    generator.addMapping({
      original: {
        line: origin_position.line,
        column: origin_position.column
      },
      generated: {
        line: mapping.generatedLine,
        column: mapping.generatedColumn
      },
      source: origin_position.source,
      name: origin_position.name
    })
  })

  
  consumers.forEach(function (consumer) {
    // @ts-ignore
    consumer.sources.forEach(source => {
      // @ts-ignore
      generator._sources.add(source)

      const source_content = consumer.sourceContentFor(source)
      if (source_content != null) {
        generator.setSourceContent(source, source_content)
      }
    })
  })

  // @ts-ignore
  generator._sourceRoot = origin.sourceRoot
  // @ts-ignore
  generator._file = target.file

  return JSON.parse(generator.toString())
}

export function make_inline_sourcemap(sourcemap: RawSourceMap) {
  const str = '/*# sourceMappingURL=data:application/json;base64,' + Buffer.from(JSON.stringify(sourcemap)).toString('base64') + ' */'
  return str
}