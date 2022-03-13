'use strict'

const { v4 } = require('uuid')
const Constants = require('./Constants')
const { Client } = require('@elastic/elasticsearch')
const {
  extractSearchResponse,
  extractSearchResponseExactAndShingles,
  extractSearchResponseSynonym,
  populateDiscourseListWithoutHighlights,
} = require('./Utils')
const {
  populateESBody,
  populateESBodyForDiscourseIndexStandardExactShingle,
} = require('./ESBody')
const {
  populateESBodyForDiscourseIndexSynonym,
} = require('./GeneralAndSpecificSynonymsBody')

const client = new Client({
  node: 'http://localhost:9200',
})

const index = 'discourse_analyser_index'
const discourseIndex = 'discourse_index'
// const discourse_search_index = "discourse_search_index";
//const discourse_search_index = 'discourse_search_index_temp'
const discourse_search_index = 'discourse_search_index_unencoded'
const discourse_search_index_dev = 'discourse_search_index_temp'
const bookmarkIndex = 'bookmark_index'
const discourse_index_exact_shingle = 'discourse_index_exact_shingle'

const searchAdvanced = async function (data) {
  console.log(' inside searchAdvanced received data ' + data)

  const requestBody = populateESBody(data)

  const response = await client.search({
    index: index,
    body: requestBody.toJSON(),
  })
  return extractSearchResponse(response)
}
const searchShinglesAndExact = async function (data) {
  console.log('inside searchShinglesAndExact received data ' + data)

  const requestBody = populateESBodyForDiscourseIndexStandardExactShingle(data)

  const response = await client.search({
    index: discourse_index_exact_shingle,
    body: requestBody.toJSON(),
  })
  return extractSearchResponseExactAndShingles(response)
}

const searchWithSynonyms = async function (data, advancedSettings) {
  console.log('inside searchWithSynonyms received data ' + data)

  const requestBody = populateESBodyForDiscourseIndexSynonym(
    data,
    advancedSettings,
  )

  const response = await client.search({
    index: discourse_search_index,
    body: requestBody.toJSON(),
  })
  return extractSearchResponseSynonym(response)
}

const registerUserId = async (userName) => {
  const searchResponse = await client.search({
    index: bookmarkIndex,
    body: {
      query: {
        term: {
          userName: userName,
        },
      },
    },
  })

  const isUserNameExists =
    searchResponse.body.hits.total.value === 0 ? false : true

  console.log(` is username ${userName} exists : ${isUserNameExists}`)
  if (!isUserNameExists) {
    const userId = v4()
    const response = await client.index({
      index: bookmarkIndex,
      refresh: true,
      body: {
        userName: userName,
        userId: userId,
        bookmarkArray: [],
        tagArray: [],
      },
    })
    console.log(response.body)
    if (response.body.result === 'created') {
      return getUserObject(userId).then((response) => {
        const result = {
          response: Constants.SUCCESS,
          result: response,
        }
        return result
      })
    } else {
      console.error(
        'Error while insert user object which shouldnt be case. Debug',
      )
    }
  } else {
    const result = {
      response: Constants.ERROR_OCCUPIED,
      result: 'With Same name another user was registered',
    }
    return result
  }
}

const addDiscourse = async function (userId, discourseId) {
  try {
    console.log(`finding user id :${userId}`)
    const searchResponse = await client.search({
      index: bookmarkIndex,
      body: {
        query: {
          term: {
            userId: userId,
          },
        },
      },
    })

    const isUserIdExists =
      searchResponse.body.hits.total.value === 0 ? false : true

    if (isUserIdExists) {
      let bookMarkId = searchResponse.body.hits.hits[0]._id
      console.log(`bookMarkId : ${bookMarkId}`)
      const { body } = await client.update({
        index: bookmarkIndex,
        id: bookMarkId,
        body: {
          script: {
            lang: 'painless',
            source: `if (!ctx._source.bookmarkArray.contains('${discourseId}')) {ctx._source.bookmarkArray.add('${discourseId}')}`,
          },
        },
      })
      return getUserObjectWithBookmarkId(bookMarkId).then((response) => {
        const result = {
          response: Constants.SUCCESS,
          // bookmarkArray: response.bookmarkArray,
          result: response,
        }
        console.log(`result : `, result)
        return result
      })
    } else {
      return {
        message: Constants.USER_NOT_AVAILABLE,
        response: Constants.ERROR,
      }
    }
  } catch (e) {
    console.log(`exception ${e}`)
    return {
      message: Constants.SOMETHING_WENT_WRONG + ' : ' + e.message,
      response: Constants.Error,
    }
  }
}
const removeDiscourse = async function (userId, discourseId) {
  try {
    console.log(`finding user id :${userId}`)
    const searchResponse = await client.search({
      index: bookmarkIndex,
      body: {
        query: {
          term: {
            userId: userId,
          },
        },
      },
    })

    const isUserIdExists =
      searchResponse.body.hits.total.value === 0 ? false : true

    if (isUserIdExists) {
      let bookMarkId = searchResponse.body.hits.hits[0]._id
      console.log(`bookMarkId : ${bookMarkId}`)
      const { body } = await client.update({
        index: bookmarkIndex,
        id: bookMarkId,
        body: {
          script: {
            lang: 'painless',
            source: `if (ctx._source.bookmarkArray.contains('${discourseId}')) {ctx._source.bookmarkArray.remove(ctx._source.bookmarkArray.indexOf('${discourseId}'))}`,
          },
        },
      })
      return getUserObjectWithBookmarkId(bookMarkId).then((response) => {
        const result = {
          response: Constants.SUCCESS,
          // bookmarkArray: response.bookmarkArray,
          result: response,
        }
        console.log(`result : `, result)
        return result
      })
    } else {
      return {
        message: Constants.USER_NOT_AVAILABLE,
        response: Constants.ERROR,
      }
    }
  } catch (e) {
    console.log(`exception ${e}`)
    return {
      message: Constants.SOMETHING_WENT_WRONG + ' : ' + e.message,
      response: Constants.Error,
    }
  }
}

const getUserObject = async function (userId) {
  try {
    console.log(`finding user id :${userId}`)
    const searchResponse = await client.search({
      index: bookmarkIndex,
      body: {
        query: {
          term: {
            userId: userId,
          },
        },
      },
    })

    const isUserIdExists =
      searchResponse.body.hits.total.value === 0 ? false : true

    if (isUserIdExists) {
      let bookMarkId = searchResponse.body.hits.hits[0]._id
      console.log(`bookMarkId : ${bookMarkId}`)
      const { body } = await client.get({
        index: bookmarkIndex,
        id: bookMarkId,
      })
      console.log(body)
      return { ...body._source }
    } else return { result: 'user not available' }
  } catch (e) {
    console.log(`exception ${e}`)
  }
  return { result: 'something went wrong' }
}

const getLoginId = async function (userName) {
  try {
    console.log(`finding with user Name  :${userName}`)
    const searchResponse = await client.search({
      index: bookmarkIndex,
      body: {
        query: {
          term: {
            userName: userName,
          },
        },
      },
    })

    const isUserIdExists =
      searchResponse.body.hits.total.value === 0 ? false : true

    if (isUserIdExists) {
      let bookMarkId = searchResponse.body.hits.hits[0]._id
      console.log(`bookMarkId : ${bookMarkId}`)
      const { body } = await client.get({
        index: bookmarkIndex,
        id: bookMarkId,
      })
      console.log(body)
      return { response: Constants.SUCCESS, result: { ...body._source } }
    } else
      return {
        response: Constants.ERROR,
        message: Constants.ERROR_USER_DOES_NOT_EXISTS,
      }
  } catch (e) {
    console.log(`exception ${e}`)
    throw Error(e.message)
  }
}

const getUserObjectWithBookmarkId = async function (bookMarkId) {
  try {
    console.log(`bookMarkId : ${bookMarkId}`)
    const { body } = await client.get({
      index: bookmarkIndex,
      id: bookMarkId,
    })
    console.log(body)
    return { ...body._source }
  } catch (e) {
    console.log(`exception ${e}`)
  }
  return { result: 'something went wrong' }
}

const getAllDiscourseFromBookmarkArray = async (discourseArray) => {
  try {
    console.log(`discourseArray : ${discourseArray}`)
    const searchResponse = await client.search({
      index: discourse_search_index,
      body: {
        query: {
          terms: {
            discourse_id: discourseArray,
          },
        },
      },
    })

    const areDiscourseExists = (searchResponse.body.hits.total.value = !0
      ? true
      : false)
    if (areDiscourseExists) {
      return {
        result: 'success',
        bookMarkedDiscourses: populateDiscourseListWithoutHighlights(
          searchResponse.body.hits.hits,
        ),
      }
    } else {
      return {
        result: 'failed',
        message: 'No discourses found with given bookmarkArray',
      }
    }
  } catch (e) {
    console.log(`exception ${e}`)
  }
  return { result: 'something went wrong' }
}

const addTag = async function (userId, tagName) {
  try {
    console.log(`finding user id :${userId}`)
    const searchResponse = await client.search({
      index: bookmarkIndex,
      body: {
        query: {
          term: {
            userId: userId,
          },
        },
      },
    })

    const isUserIdExists =
      searchResponse.body.hits.total.value === 0 ? false : true

    if (isUserIdExists) {
      let bookMarkId = searchResponse.body.hits.hits[0]._id
      console.log(`bookMarkId : ${bookMarkId}`)
      const { body } = await client.update({
        index: bookmarkIndex,
        id: bookMarkId,
        body: {
          script: {
            lang: 'painless',
            source: `if (!ctx._source.tagArray.contains('${tagName}')) {ctx._source.tagArray.add('${tagName}'); ctx._source['${tagName}']=[]}`,
          },
        },
      })
      return getUserObjectWithBookmarkId(bookMarkId).then((response) => {
        const result = {
          response: Constants.SUCCESS,
          // bookmarkArray: response.bookmarkArray,
          result: response,
        }
        console.log(`result : `, result)
        return result
      })
    } else {
      return {
        message: Constants.USER_NOT_AVAILABLE,
        response: Constants.ERROR,
      }
    }
  } catch (e) {
    console.log(`exception ${e}`)
    return {
      message: Constants.SOMETHING_WENT_WRONG + ' : ' + e.message,
      response: Constants.Error,
    }
  }
}

const removeTag = async function (userId, tagName) {
  try {
    console.log(`finding user id :${userId}`)
    const searchResponse = await client.search({
      index: bookmarkIndex,
      body: {
        query: {
          term: {
            userId: userId,
          },
        },
      },
    })

    const isUserIdExists =
      searchResponse.body.hits.total.value === 0 ? false : true

    if (isUserIdExists) {
      let bookMarkId = searchResponse.body.hits.hits[0]._id
      console.log(`bookMarkId : ${bookMarkId}`)
      const { body } = await client.update({
        index: bookmarkIndex,
        id: bookMarkId,
        body: {
          script: {
            lang: 'painless',
            source: `if (ctx._source.tagArray.contains('${tagName}')) {ctx._source.tagArray.remove(ctx._source.tagArray.indexOf('${tagName}')); ctx._source.remove('${tagName}')} `,
          },
        },
      })
      return getUserObjectWithBookmarkId(bookMarkId).then((response) => {
        const result = {
          response: Constants.SUCCESS,
          // bookmarkArray: response.bookmarkArray,
          result: response,
        }
        console.log(`result : `, result)
        return result
      })
    } else {
      return {
        message: Constants.USER_NOT_AVAILABLE,
        response: Constants.ERROR,
      }
    }
  } catch (e) {
    console.log(`exception ${e}`)
    return {
      message: Constants.SOMETHING_WENT_WRONG + ' : ' + e.message,
      response: Constants.Error,
    }
  }
}

const addDiscourseToTag = async function (userId, tagName, discourseId) {
  try {
    console.log(`finding user id :${userId}`)
    const searchResponse = await client.search({
      index: bookmarkIndex,
      body: {
        query: {
          term: {
            userId: userId,
          },
        },
      },
    })

    const isUserIdExists =
      searchResponse.body.hits.total.value === 0 ? false : true

    if (isUserIdExists) {
      let bookMarkId = searchResponse.body.hits.hits[0]._id
      console.log(`bookMarkId : ${bookMarkId}`)
      const { body } = await client.update({
        index: bookmarkIndex,
        id: bookMarkId,
        body: {
          script: {
            lang: 'painless',
            source: `if (!ctx._source.${tagName}.contains('${discourseId}')) {ctx._source.${tagName}.add('${discourseId}');}`,
          },
        },
      })
      return getUserObjectWithBookmarkId(bookMarkId).then((response) => {
        const result = {
          response: Constants.SUCCESS,
          // bookmarkArray: response.bookmarkArray,
          result: response,
        }
        console.log(`result : `, result)
        return result
      })
    } else {
      return {
        message: Constants.USER_NOT_AVAILABLE,
        response: Constants.ERROR,
      }
    }
  } catch (e) {
    console.log(`exception ${e}`)
    return {
      message: Constants.SOMETHING_WENT_WRONG + ' : ' + e.message,
      response: Constants.Error,
    }
  }
}

const removeDiscourseFromTag = async function (userId, tagName, discourseId) {
  try {
    console.log(`finding user id :${userId}`)
    const searchResponse = await client.search({
      index: bookmarkIndex,
      body: {
        query: {
          term: {
            userId: userId,
          },
        },
      },
    })

    const isUserIdExists =
      searchResponse.body.hits.total.value === 0 ? false : true

    if (isUserIdExists) {
      let bookMarkId = searchResponse.body.hits.hits[0]._id
      console.log(`bookMarkId : ${bookMarkId}`)
      const { body } = await client.update({
        index: bookmarkIndex,
        id: bookMarkId,
        body: {
          script: {
            lang: 'painless',
            source: `if (ctx._source.${tagName}.contains('${discourseId}')) {ctx._source.${tagName}.remove(ctx._source.${tagName}.indexOf('${discourseId}')); } `,
          },
        },
      })
      return getUserObjectWithBookmarkId(bookMarkId).then((response) => {
        const result = {
          response: Constants.SUCCESS,
          // bookmarkArray: response.bookmarkArray,
          result: response,
        }
        console.log(`result : `, result)
        return result
      })
    } else {
      return {
        message: Constants.USER_NOT_AVAILABLE,
        response: Constants.ERROR,
      }
    }
  } catch (e) {
    console.log(`exception ${e}`)
    return {
      message: Constants.SOMETHING_WENT_WRONG + ' : ' + e.message,
      response: Constants.Error,
    }
  }
}
module.exports = {
  searchAdvanced,
  searchShinglesAndExact,
  searchWithSynonyms,
  registerUserId,
  addDiscourse,
  getUserObject,
  removeDiscourse,
  getAllDiscourseFromBookmarkArray,
  getLoginId,
  addTag,
  removeTag,
  addDiscourseToTag,
  removeDiscourseFromTag,
}
