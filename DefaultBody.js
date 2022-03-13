const highlightForDiscourseIndex = esb
  .highlight()
  .numberOfFragments(3)
  .fragmentSize(150)
  .scoreOrder()
  .fields(["textdc", "textdc_exact"])
  .preTags("<strong><em><u>")
  .postTags("</u></em></strong>");

const listOfShouldClauseQueries = (data) => {
  return [
    esb
      .boolQuery()
      .must([esb.matchQuery("title_shingles", data)])
      .should([esb.matchQuery("title_exact", data).operator("and")]),

    esb.matchQuery("textdc_exact", data),
    esb.matchQuery("textdc_shingles", data),
  ];
};

const populateESBodyForDiscourseIndexStandardExactShingle = (data) => {
  return esb
    .requestBodySearch()
    .query(
      esb
        .boolQuery()
        .must(
          esb
            .multiMatchQuery(["title", "textdc"], data)
            .fuzziness(1)
            .prefixLength(2)
            .tieBreaker(0.3)
            .type("best_fields")
        )
        .should(listOfShouldClauseQueries(data))
    )
    .source(true)
    .highlight(highlightForDiscourseIndex)
    .size(20);
};
