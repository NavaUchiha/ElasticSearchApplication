
const esb = require('elastic-builder');



const highlight = esb.highlight()
    .numberOfFragments(3)
    .fragmentSize(150)
    .scoreOrder()
    .fields(['title', 'summary', 'textDC'])
    .preTags('<strong><em>')
    .postTags('</em></strong>');

const rescoreBody = (data) => {
    return esb.rescore(20, esb.multiMatchQuery(['title', 'summary', 'textDC'], data).type("most_fields").operator("and"))
        .queryWeight(0.7)
        .rescoreQueryWeight(1.2)
        .scoreMode("total");
}
const populateESBody = (data) => {
   // console.log('print  DiscourseIndexStandardExactShingle body')
    //console.log(populateESBodyForDiscourseIndexStandardExactShingle(data).toJSON())
    return esb.requestBodySearch()
        .query(esb.boolQuery()
            .must(
                esb.multiMatchQuery(['title', 'summary', 'textDC'], data)
                    .fuzziness('auto').prefixLength(2).tieBreaker(0.3).type("best_fields"))
            .should(
                [esb.matchQuery('title', data), esb.matchQuery('summary', data), esb.matchQuery('textDC', data)])
            //[esb.matchPhrasePrefixQuery('title', data), esb.matchPhrasePrefixQuery('summary', data), esb.matchPhrasePrefixQuery('textDC', data)])
            //.minimumShouldMatch()
            //.boost(5.0)
        ).explain(true)
        .rescore(rescoreBody(data))
        .source(true)
        .highlight(highlight)
        .size(20);

}



const highlightForDiscourseIndex = esb.highlight()
    .numberOfFragments(3)
    .fragmentSize(150)
    .scoreOrder()
    .fields(['textdc','textdc_exact'])
    .preTags('<strong><em><u>')
    .postTags('</u></em></strong>');

const rescoreBodyForDiscourseIndex = (data) => {
    return esb.rescore(20, esb.multiMatchQuery(['title', 'textdc'], data).type("most_fields").operator("and"))
        .queryWeight(0.6)
        .rescoreQueryWeight(1.4)
        .scoreMode("avg");
}
const populateESBodyForDiscourseIndex = (data) => {
    return esb.requestBodySearch()
        .query(esb.boolQuery()
            .must(
                esb.multiMatchQuery(['title', 'textdc'], data)
                    .fuzziness('auto').tieBreaker(0.3).type("best_fields"))
            .should(
                [esb.matchQuery('title', data), esb.matchQuery('textdc', data)])
            //[esb.matchPhrasePrefixQuery('title', data), esb.matchPhrasePrefixQuery('summary', data), esb.matchPhrasePrefixQuery('textDC', data)])
            //.minimumShouldMatch()
            //.boost(5.0)
        )
        .rescore(rescoreBodyForDiscourseIndex(data))
        .source(true)
        .highlight(highlightForDiscourseIndex)
        .size(20);
}

const listOfShouldClauseQueries = (data) => {


    return [
    esb.boolQuery()
    .must([esb.matchQuery('title_shingles', data)])
    .should([esb.matchQuery('title_exact', data).operator("and")]),

    esb.matchQuery('textdc_exact', data),
    esb.matchQuery('textdc_shingles', data),
    ]
}

const populateESBodyForDiscourseIndexStandardExactShingle = (data) => {
    return esb.requestBodySearch()
        .query(esb.boolQuery()
            .must(
                esb.multiMatchQuery(['title', 'textdc'], data)
                    .fuzziness(1).prefixLength(2).tieBreaker(0.3).type("best_fields"))
            .should(listOfShouldClauseQueries(data))
            //[esb.matchPhrasePrefixQuery('title', data), esb.matchPhrasePrefixQuery('summary', data), esb.matchPhrasePrefixQuery('textDC', data)])
            //.minimumShouldMatch()
            //.boost(5.0)
        )
        // .rescore(rescoreBodyForDiscourseIndex(data))
        .source(true)
        .highlight(highlightForDiscourseIndex)
        .size(20);
}


module.exports = { populateESBody, populateESBodyForDiscourseIndexStandardExactShingle }