


const navigationBtnArr = document.querySelectorAll('.navigation-btn')
const contentContainer = document.querySelector('.content-container')

let myWatchlist = []
if(localStorage.getItem('myWatchlist')){
    myWatchlist = JSON.parse(localStorage.getItem('myWatchlist'))
}

let totalPageCount = Math.ceil(myWatchlist.length / 10)

let currentPageIdx = 1
renderWatchlist(currentPageIdx)

document.addEventListener('click', function(event){
    if (event.target.dataset.imdb){
        handleReadMore(event.target.dataset.imdb)
    } else if (event.target.dataset.navId){
        let targetPage = 0
        switch(event.target.dataset.navId){
            case '0':
                targetPage = currentPageIdx - 1
                break
            case '1':
                targetPage = 1
                break
            case '2':
                targetPage = totalPageCount
                break
            case '3':
                targetPage = currentPageIdx + 1
                break
            default:
        } 
        renderWatchlist(targetPage)
    }
})

function renderWatchlist(pageIdx=1) {
    try{

        if(myWatchlist.length !== 0){
            navigationBtnArr.forEach(btn => btn.disabled = true)
            contentContainer.innerHTML = `
                <div class='film-outer-container'>
                    <div class='film-container'>
                        <img src='./images/buffering.gif' class='buffering-gif'/>
                    </div>
                    <p class='hint-message'>Loading...</p>
                </div>
                `
            
            // Populate the search result with more details containing the following keyword:
            // Runtime, Genre, Plot, imdbRating 
            let currentPageWatchlist = myWatchlist.slice((pageIdx-1)*10,(pageIdx-1)*10+10) //Create a shallow copy
            let htmlStr = ''
            for (let item of currentPageWatchlist){
            
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
    
            // Update page count
            currentPageIdx = pageIdx
    
            //Update total page count
            totalPageCount = Math.ceil(myWatchlist.length / 10)
    
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

        } else {
            document.querySelector('.content-container').innerHTML = `
                <div class='film-outer-container'>
                    <div class='film-container'>
                        <a href='./index.html'>
                            <i class="fa-solid fa-film"></i>
                        </a>
                    </div>
                    <a href='./index.html'>
                        <p class='hint-message'>Start Exploring</p>
                    </a>
                </div>
            `
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
        if(myWatchlist.length%10===0 & currentPageIdx !==1){
            currentPageIdx--
        }
    } 

    renderWatchlist(currentPageIdx)

    localStorage.setItem('myWatchlist', JSON.stringify(myWatchlist))
}


function handleReadMore(imdbID){
    const selectedMovie = myWatchlist.filter(movie=>movie.imdbID === imdbID)[0]
    document.getElementById(`readMore${imdbID}`).parentElement.textContent = `
        ${selectedMovie.Plot}
    `
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