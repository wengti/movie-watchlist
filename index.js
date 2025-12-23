

const apiKey = 'Get from OMDB'


let basicSearchResultArr = []
let totalResults = 0
let totalPageCount = 0
let currentPageIdx = 1

let isfilterContainerDisplayed = false
let filterYearInput = ''
let filterTypeInput = ''

const searchForm = document.getElementById('search-form')
const contentContainer = document.querySelector('.content-container')
const navigationBtnArr = document.querySelectorAll('.navigation-btn')
const outerFilterContainer = document.getElementById('outer-filter-container')

let myWatchlist = []
if(localStorage.getItem('myWatchlist')){
    myWatchlist = JSON.parse(localStorage.getItem('myWatchlist'))
}


document.addEventListener('click', function(event){
    if (event.target.dataset.imdb){
        handleReadMore(event.target.dataset.imdb)
    } else if (event.target.dataset.navId){
        console.log("Enter")
        let targetPage = 0
        switch(event.target.dataset.navId){
            case '0':
                targetPage = currentPageIdx - 1
                break;
            case '1':
                targetPage = 1
                break;
            case '2':
                targetPage = totalPageCount
                break;
            case '3':
                targetPage = currentPageIdx + 1
                break;
            default:
        } 
        renderPage(targetPage)
    } else if(event.target.id === 'filter-btn'){
        if (isfilterContainerDisplayed){
            outerFilterContainer.style.display = 'none'
        } else {
            outerFilterContainer.style.display = 'grid'
        }
        isfilterContainerDisplayed = !isfilterContainerDisplayed
    } else if (event.target.id === 'sort-btn'){
        handleSort()
    }
    
})

searchForm.addEventListener('submit', handleSearchSubmit)



// Main functions
async function handleSearchSubmit(event){
    event.preventDefault()
    basicSearchResultArr = []
    totalResults = 0
    totalPageCount = 0

    const searchFormData = new FormData(searchForm)
    
    let searchName = searchFormData.get('search-name')
    searchName = searchName.replaceAll(' ', '%20')
    console.log(searchName)

    let initialUrl = `http://www.omdbapi.com/?apikey=${apiKey}&s=${searchName}`

    filterYearInput = document.getElementById('fyi').value
    if(filterYearInput){
        console.log(filterYearInput)
        initialUrl += `&y=${filterYearInput}`
    }

    filterTypeInput = document.getElementById('fti').value
    if(filterTypeInput){
        console.log(filterTypeInput)
        initialUrl += `&type=${filterTypeInput}`
    }
    console.log(initialUrl)

    try{
        
        contentContainer.innerHTML = `
        <div class='film-outer-container'>
            <div class='film-container'>
                <img src='./images/buffering.gif' class='buffering-gif'/>
            </div>
            <p class='hint-message'>Searching...</p>
        </div>
        `        
        
        const res = await fetch(initialUrl)
        const data = await handleReturnedResponse(res)
        

        const findTotalResponse = true
        totalResults = handleSearchResult(data, findTotalResponse)
        totalPageCount = Math.ceil(totalResults / 10)

        console.log(totalResults)
        // Get the basic search results
        // Each object has the following keyword:
        // Title, Year, imdbID, Type, Poster
        let pageCount = 1
        while(pageCount <= totalPageCount){
            let basicSearchUrl = `http://www.omdbapi.com/?apikey=${apiKey}&s=${searchName}&page=${pageCount}`
            if(filterYearInput){
                basicSearchUrl += `&y=${filterYearInput}`
            }
            if(filterTypeInput){
                basicSearchUrl += `&type=${filterTypeInput}`
            }

            const res = await fetch(basicSearchUrl)
            const data = await handleReturnedResponse(res)

            const findTotalResponse = false
            basicSearchResultArr.push(...handleSearchResult(data, findTotalResponse))
            
            document.querySelector('.hint-message').textContent = `Collecting search result from Page ${pageCount} out of ${totalPageCount}`

            pageCount++
        }

        for (let item of basicSearchResultArr){
            item.Year = item.Year.slice(0,4) //Take only the first 4 digit of the year
        }

        const pageIdx = 1
        renderPage(pageIdx)
        
    } catch(err) {
        displayError(err)
    }
}

function handleReturnedResponse(res){
    if(!res.ok){
        console.log(res.status)
        throw Error(`Returned Status: ${res.status}. Check API key or API limit.`)
    }
    return res.json()
}

function handleSearchResult(data, findTotalResponse=false){
    if (data.Response === 'False'){
        console.log(data)
        throw Error(`${data.Error}. Please try another search.`)
    }
    
    // Returned total number of pages if findTotalResponse
    if (findTotalResponse){
       return data.totalResults
    } else {
        return data.Search
    }

}


async function renderPage(pageIdx=1){

    try{
        console.log(basicSearchResultArr)
        navigationBtnArr.forEach(btn => btn.disabled = true)
        contentContainer.innerHTML = `
            <div class='film-outer-container'>
                <div class='film-container'>
                    <img src='./images/buffering.gif' class='buffering-gif'/>
                </div>
                <p class='hint-message'>Finetuning...</p>
            </div>
            `
        
        // Populate the search result with more details containing the following keyword:
        // Runtime, Genre, Plot, imdbRating 
        let currentPageSearchResultArr = basicSearchResultArr.slice((pageIdx-1)*10,(pageIdx-1)*10+10) //Create a shallow copy
        let htmlStr = ''
        for (let item of currentPageSearchResultArr){
    
            // Only perform a more detailed search if these detils have not been browsed
            if (!item.Runtime){
                let {imdbID} = item
                const refinedSearchUrl = `http://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}&plot=full`
        
                const res = await fetch(refinedSearchUrl)
                const data = await handleReturnedResponse(res)
        
                item.Runtime = data.Runtime
                item.Genre = data.Genre
                item.Plot = data.Plot
                item.imdbRating = data.imdbRating
            } 
    
            let {Title, Year, imdbID, Type, Poster, Runtime, Genre, Plot, imdbRating} = item
            
            let thirdRowContent = ''
            if(Plot.length > 170){
                thirdRowContent = `
                    ${Plot.slice(0, 171)}
                    <span class='read-more' id='readMore${imdbID}' data-imdb=${imdbID}>... Read More<span>
                `
            } else {
                thirdRowContent = `
                    ${Plot}
                `
            }
            
            
            let watchlistIcon = ``
            if(myWatchlist.filter(watchlistedFilm => watchlistedFilm.imdbID === imdbID).length > 0){
                watchlistIcon = `
                <i class="fa-solid fa-check"></i>
                <span>Watchlisted</span>
                `
            } else {
                watchlistIcon = `
                <i class="fa-solid fa-circle-plus"></i>
                <span>Watchlist</span>
                `
            }


            htmlStr += `
                <div class='card-container'>
                    <div class='card-img-container'>
                        <img src='${Poster}' class='card-img'
                            onerror= "this.src='./images/no-image.png'"/>
                    </div>
                    <div class='card-detail-container'>
                        <div class='top-row'>
                            <h2 class='card-title'>${Title}</h2>
                            <p class='card-rating'><i class="fa-solid fa-star"></i><span>${imdbRating}</span></p>
                            <button class='watchlist-btn' data-film-id='${imdbID}'>
                                ${watchlistIcon}
                            </button>
                        </div>
                        <div class='second-row'>
                            <p class='card-genre'>${Genre}</p>
                            <p class='card-year'>Released in ${Year}</p>
                            <p class='card-runtime'>${Runtime}</p>
                        </div>
                        <div class='third-row'>
                            ${thirdRowContent}
                        </div>
                    </div>
                </div>
            `
        }

        document.querySelector('.content-container').innerHTML = htmlStr

        document.querySelectorAll('.watchlist-btn').forEach( 
            btn => {
                console.log('Enter')
                btn.addEventListener('click', function(event){
                    console.log('added')
                    handleWatchlistClick(event)
                })
            }
        )
        // Since currentPageSearchResultArr is a shallow copy
        // Both currentPageSearchResultArr and currentPageSearchResultArr will have its object content changed
    } catch(err){
        displayError(err)
    }

    

    navigationBtnArr.forEach(btn => btn.disabled = false)
    if(pageIdx === totalPageCount){
        navigationBtnArr[2].disabled = true
        navigationBtnArr[3].disabled = true
    }
    if (pageIdx === 1){
        navigationBtnArr[0].disabled = true
        navigationBtnArr[1].disabled = true
    }


    document.getElementById('page').textContent = `${pageIdx}/${totalPageCount}`
    currentPageIdx = pageIdx

    
}




async function handleSort(){
    try{
        if(basicSearchResultArr.length === 0){
            throw Error('No search result to be sorted. Please search first.')
        } else {
            const sortTypeInput = document.getElementById('sti').value

            if(sortTypeInput === 'year-d') {
                basicSearchResultArr.sort(function(a,b){
                    return b.Year-a.Year
                })
            } else if (sortTypeInput ==='year-a') {
                basicSearchResultArr.sort(function(a,b){
                    return a.Year - b.Year
                })
            } else {

                let resultIdx = 1
                for (let item of basicSearchResultArr){
                // Only perform a more detailed search if these detils have not been browsed
                    if (!item.Runtime){
                        let {imdbID} = item
                        const refinedSearchUrl = `http://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}&plot=full`
                
                        const res = await fetch(refinedSearchUrl)
                        const data = await handleReturnedResponse(res)
                
                        item.Runtime = data.Runtime
                        item.Genre = data.Genre
                        item.Plot = data.Plot
                        item.imdbRating = data.imdbRating
                    }

                    resultIdx++
                    if (resultIdx % 10 === 0){
                        contentContainer.innerHTML = `
                            <div class='film-outer-container'>
                                <div class='film-container'>
                                    <img src='./images/buffering.gif' class='buffering-gif'/>
                                </div>
                                <p class='hint-message'>Collected ${resultIdx}/ ${totalResults} results </p>
                            </div>
                            `
                    }
                }

                switch(sortTypeInput){
                        
                    case 'runtime-d':
                        basicSearchResultArr.sort(function(a, b){
    
                            if(a.Runtime==='N/A'){return getNumberFromText(b.Runtime) - Number.NEGATIVE_INFINITY}
                            else if(b.Runtime==='N/A'){return Number.NEGATIVE_INFINITY - getNumberFromText(a.Runtime)}
                            else {return getNumberFromText(b.Runtime) - getNumberFromText(a.Runtime)}
                            
                        })
                        console.log(basicSearchResultArr)
                        break
                    
                    case 'runtime-a':
                        basicSearchResultArr.sort(function(a, b){
                            if(a.Runtime==='N/A'){return Number.POSITIVE_INFINITY - getNumberFromText(b.Runtime)}
                            else if(b.Runtime==='N/A'){return getNumberFromText(a.Runtime) - Number.POSITIVE_INFINITY}
                            else {return getNumberFromText(a.Runtime) - getNumberFromText(b.Runtime)}
                        })
                        break
                    
                    case 'rating-d':
                        basicSearchResultArr.sort(function(a, b){
    
                            if(a.imdbRating==='N/A'){return b.imdbRating - Number.NEGATIVE_INFINITY}
                            else if(b.imdbRating==='N/A'){return Number.NEGATIVE_INFINITY - a.imdbRating}
                            else {return b.imdbRating - a.imdbRating}
                            
                        })
                        console.log(basicSearchResultArr)
                        break
                    
                    case 'rating-a':
                        basicSearchResultArr.sort(function(a, b){
                            if(a.imdbRating==='N/A'){return Number.POSITIVE_INFINITY - b.imdbRating}
                            else if(b.imdbRating==='N/A'){return a.imdbRating - Number.POSITIVE_INFINITY}
                            else {return a.imdbRating - b.imdbRating}
                        })
                        break
    
                    default:
                }
            }
        


            currentPageIdx = 1
            renderPage(currentPageIdx)
    
        }
    } catch(err){
        displayError(err)
    }
}

function handleWatchlistClick(event){
    console.log('watchlist button clicked')
    let filmId = ''
    if(!event.target.dataset.filmId){
        // In case of clicking the icon instead of button
        filmId = event.target.parentElement.dataset.filmId
    } else {
        filmId = event.target.dataset.filmId
    }

    const idxInWatchlist = myWatchlist.findIndex(watchlistItem => watchlistItem.imdbID === filmId)
    console.log('In the watchlist, this film is at ' + idxInWatchlist)
    if(idxInWatchlist !== -1){
        myWatchlist.splice(idxInWatchlist,1)
    } else {
        const targetItem = basicSearchResultArr.filter(result => result.imdbID === filmId)[0]
        myWatchlist.push(targetItem)
    }

    renderPage(currentPageIdx)

    localStorage.setItem('myWatchlist', JSON.stringify(myWatchlist))
}

function handleReadMore(imdbID){
    const selectedMovie = basicSearchResultArr.filter(movie=>movie.imdbID === imdbID)[0]
    document.getElementById(`readMore${imdbID}`).parentElement.textContent = `
        ${selectedMovie.Plot}
    `
}


function getNumberFromText(entry){
    let temp = ''
    for (let letter of entry){
        if (!isNaN(letter)){
            temp += letter
        }
    }
    return Number(temp)
}




function displayError(err){
    contentContainer.innerHTML = `
        <div class='film-outer-container'>
            <div class='film-container'>
                <i class="fa-solid fa-film"></i>
            </div>
            <p class='hint-message'>${err}</p>
        </div>
    `
}