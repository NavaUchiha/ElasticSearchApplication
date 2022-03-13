const listOfFieldsPassing = [
  "title",
  "summary",
  "textDC",
  "masterId",
  "dcId",
  "recordDate",
  "log_day",
];
const listOfFieldsPassingSynonym = [
  "title",
  "summary",
  "textdc",
  "masterid",
  "dcid",
  "recorddate",
  "discourse_id",
  "title_exact",
  "text_dc_exact",
  "summary_exact",
];
const listOfFieldsInExactShinglesIndex = [
  "title",
  "summary",
  "textdc",
  "masterid",
  "dcid",
  "recorddate",
];

const joinedHighlightArrays = function (joinHighlightArrays) {
  if (!joinHighlightArrays) return [];
  let finalArray = [];
  joinHighlightArrays = Object.values(joinHighlightArrays);
  joinHighlightArrays.forEach((element) => {
    if (Array.isArray(element) && element.length > 0) {
      finalArray = finalArray.concat(element);
    }
  });
  return finalArray;
};

const populateDiscourseListWithoutHighlights = function (arrayOfDiscourses) {
  const mappedDiscourse = [];
  arrayOfDiscourses.map((discourseObj) => {
    var obj = {};
    discourse = discourseObj._source;
    listOfFieldsPassingSynonym.forEach((field) => {
      if (field in discourse) {
        obj[field] = discourse[field];
      }
    });

    mappedDiscourse.push(obj);
  });
  return mappedDiscourse;
};
const populateDiscourseInnerListSynonym = function (arrayOfDiscourses) {
  console.log("array Of discourses : ", arrayOfDiscourses);
  if (arrayOfDiscourses.length < 0) {
    return [];
  }
  const mappedDiscourse = [];
  arrayOfDiscourses.map((discourseObj) => {
    var obj = {};
    discourse = discourseObj._source;
    obj["score"] = discourseObj._score;
    listOfFieldsPassingSynonym.forEach((field) => {
      if (field in discourse) {
        obj[field] = discourse[field];
      }
    });
    const consolidatedHighlights = joinedHighlightArrays(
      discourseObj.highlight
    );
    obj["highlights"] = consolidatedHighlights;

    mappedDiscourse.push(obj);
  });
  return mappedDiscourse;
};
const populateDiscourseInnerList = function (arrayOfDiscourses) {
  const mappedDiscourse = [];
  arrayOfDiscourses.map((discourseObj) => {
    var obj = {};
    discourse = discourseObj._source;
    obj["score"] = discourseObj._score;
    listOfFieldsPassing.forEach((field) => {
      if (field in discourse) {
        obj[field] = discourse[field];
      }
    });
    const consolidatedHighlights = joinedHighlightArrays(
      discourseObj.highlight
    );
    obj["highlights"] = consolidatedHighlights;

    mappedDiscourse.push(obj);
  });
  return mappedDiscourse;
};
const populateDisocurseInnerListExactAndShingles = function (
  arrayOfDiscourses
) {
  const mappedDiscourse = [];
  arrayOfDiscourses.map((discourseObj) => {
    var obj = {};
    discourse = discourseObj._source;
    obj["score"] = discourseObj._score;
    listOfFieldsInExactShinglesIndex.forEach((field) => {
      if (field in discourse) {
        obj[field] = discourse[field];
      }
    });
    const consolidatedHighlights = joinedHighlightArrays(
      discourseObj.highlight
    );
    obj["highlights"] = consolidatedHighlights;

    mappedDiscourse.push(obj);
  });
  return mappedDiscourse;
};

const extractSearchResponse = (response) => {
  console.log(response.body);
  const result = {
    total: response.body.hits.total.value,
    max_score: response.body.hits.max_score,
    discourseList: populateDiscourseInnerList(response.body.hits.hits),
  };
  return result;
};
const extractSearchResponseExactAndShingles = (response) => {
  console.log(response.body);
  const result = {
    total: response.body.hits.total.value,
    max_score: response.body.hits.max_score,
    discourseList: populateDisocurseInnerListExactAndShingles(
      response.body.hits.hits
    ),
  };
  return result;
};
const extractSearchResponseSynonym = (response) => {
  const result = {
    total: response.body.hits.total.value,
    max_score: response.body.hits.max_score,
    discourseList: populateDiscourseInnerListSynonym(response.body.hits.hits),
  };
  return result;
};

module.exports = {
  extractSearchResponseExactAndShingles,
  extractSearchResponse,
  extractSearchResponseSynonym,
  populateDiscourseListWithoutHighlights,
};
