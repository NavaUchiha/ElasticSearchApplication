const express = require('express')
const cors = require('cors')
const app = express()
const port = 8080
const { Client } = require('@elastic/elasticsearch');
const { response } = require('express');


const client = new Client({
    node: 'http://localhost:9200'
});

app.use(cors())
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

const listOfFieldsPassing = ['title', 'summary', 'textDC', 'masterId', 'dcId', 'recordDate', 'log_day']
app.post('/searchData', (req, res) => {

    const response = searchTextInElasticSearch(req.body.searchQuery);

    response.then(result => {
        // console.log(`result is ${result.total}`)
        console.log(result.discourseList.length)
        res.send(result)
    })

})

const joinedHighlightArrays = function (joinHighlightArrays) {

    let finalArray = []
    joinHighlightArrays = Object.values(joinHighlightArrays)
    console.log(joinHighlightArrays)
    joinHighlightArrays.forEach(element => {
        if (Array.isArray(element) && element.length > 0) {
            finalArray = finalArray.concat(element)
        }
    });
    return finalArray;


}

const populateDisocurseInnerList = function (arrayOfDicourses) {
    //console.log(arrayOfDicourses[0])
    const mappedDiscourse = []
    arrayOfDicourses.map(discourseObj => {
        var obj = {}
        discourse = discourseObj._source;
        obj['score'] = discourseObj._score
        //console.log(discourse)
        listOfFieldsPassing.forEach(field => {
            if (field in discourse) {
                obj[field] = discourse[field]
            }
        })
        console.log(' *** start ***')
        const consolidatedHighlights = joinedHighlightArrays(discourseObj.highlight);
        console.log(' *** end ***')
        obj['highlights'] = consolidatedHighlights

        mappedDiscourse.push(obj)
    })
    return mappedDiscourse;

}


const searchTextInElasticSearch = function (data) {

    if (!data) return { K: 'Provide Some Data' }

    console.log('Input text received is ' + data);

    var searchParams = {

        index: 'discourse_analyser_index',
        body: {

            query: {
                "multi_match": {
                    "query": data,
                    "fuzziness": "auto",
                    "fields": ["title", "summary", "textDC"]
                }
            },
            highlight: {
                fields: {
                    "*": {
                        "pre_tags": ["<b>"],
                        "post_tags": ["</b>"]
                    }
                }
            }
        }
    }


    const extractSearchResponse = response => {
        //console.log(response)
        const result = {
            total: response.body.hits.total,
            max_score: response.body.hits.max_score,
            discourseList: populateDisocurseInnerList(response.body.hits.hits)
        };
        return result;
    };
    return client.search(searchParams)
        .then(extractSearchResponse)
}


