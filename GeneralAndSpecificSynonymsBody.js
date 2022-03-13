const esb = require('elastic-builder')

const highlightForDiscourseIndex = esb
  .highlight()
  .numberOfFragments(3)
  .fragmentSize(150)
  .scoreOrder()
  .fields(['textdc'])
  .preTags('<strong><em><u>')
  .postTags('</u></em></strong>')

const listOfShouldClauseQueries = (data, advancedSettings) => {
  console.log('inside should class')
  const shouldClassArray = []

  if (advancedSettings.isGeneralSynonymsAllowed) {
    shouldClassArray.push(
      esb.matchQuery('title', data).analyzer('search_analyzer_with_synonyms'),
    )
    shouldClassArray.push(
      esb.matchQuery('textdc', data).analyzer('search_analyzer_with_synonyms'),
    )
    shouldClassArray.push(
      esb
        .matchQuery('title_shingle', data)
        .analyzer('search_analyzer_shingle_without_synonyms'),
    )
    shouldClassArray.push(
      esb
        .matchQuery('textdc_shingle', data)
        .analyzer('search_analyzer_shingle_without_synonyms'),
    )
  } else {
    shouldClassArray.push(
      esb
        .matchQuery('title_shingle', data)
        .analyzer('search_analyzer_shingle_without_synonyms'),
    )
    shouldClassArray.push(
      esb
        .matchQuery('textdc_shingle', data)
        .analyzer('search_analyzer_shingle_without_synonyms'),
    )
  }
  console.log(shouldClassArray)
  return shouldClassArray
}

const populateESBodyForDiscourseIndexSynonym = (data, advancedSettings) => {
  const fuzzinessWrapper = () => {
    if (advancedSettings.isFuzzinessAllowed) {
      return esb
        .multiMatchQuery(['title', 'textdc'], data)
        .analyzer('basic_search_analyzer')
        .fuzziness(1)
        .prefixLength(0)
        .tieBreaker(0.3)
        .type('best_fields')
    } else {
      return esb
        .multiMatchQuery(['title', 'textdc'], data)
        .analyzer('basic_search_analyzer')
        .tieBreaker(0.3)
        .type('best_fields')
    }
  }
  console.log('fuzziness wrapper : ', fuzzinessWrapper().toJSON())
  return esb
    .requestBodySearch()
    .query(
      esb
        .boolQuery()
        .must([fuzzinessWrapper()])
        .should(listOfShouldClauseQueries(data, advancedSettings)),
    )
    .source(true)
    .highlight(highlightForDiscourseIndex)
    .size(20)
}

module.exports = { populateESBodyForDiscourseIndexSynonym }
