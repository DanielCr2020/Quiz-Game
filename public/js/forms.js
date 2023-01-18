(function ($) {
    //errors
    let errorDiv=document.getElementById('error')
    let errorDiv2=document.getElementById('error2')
    let errorDiv3=document.getElementById('error3')

    //for creating a deck
    $('#create-deck-form').submit(function (event) {
        event.preventDefault();
        let dni=$('#decknameInput').val().trim(); let dsi=$('#decksubjectInput').val().trim();
        if(dni && dsi){      //setting up request with name and subject
            let requestConfig = {
                method: "POST",
                data: {name:dni,subject:dsi}
            }       //sends request, then handles response
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success) {
                    errorDiv.hidden=true        //sets us list item HTML
                    let listItem=`<li><a href="decks/${responseMessage.id}">${responseMessage.newName}</a> - [Subject]: ${responseMessage.subject}</li>`
                    $('#deck-list').append(listItem)
                }
                else{
                    errorDiv.hidden=false
                    errorDiv.innerText=responseMessage.error     //error message thrown from routes (checking) is used here
                    $('#decknameInput').focus();
                }
                $('#create-deck-form').trigger('reset')     //reset the form regardless if it was added or not.
            })
        }
    })
    //for editing a deck
    $('#edit-deck-form').submit(function (event) {
        event.preventDefault();
        let dni=$('#decknameInput').val().trim(); let dsi=$('#decksubjectInput').val().trim();
        let oldChecked= !!($('#isDeckPublic').is(":checked"))           //old publicity status
        let requestConfig = {
            method:"PATCH",
            contentType: "application/json",
            data:JSON.stringify({name:dni,subject:dsi,public:$('#isDeckPublic').is(":checked")})
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                errorDiv.hidden=true
                if(dni)     //only updates fields that are, well, updated
                    $('#deckName').replaceWith(`<h1 id="deckName" class="deckName">${responseMessage.deckName}</h1>`)
                if(dsi)
                    $('#deckSubject').replaceWith(`<h2 id=deckSubject class="deckSubject">${responseMessage.deckSubject}</h2>`)
            }
            else{
                errorDiv.hidden=false
                errorDiv.innerHTML=responseMessage.error
                $('#decknameInput').focus()
            }
            $('#edit-deck-form').trigger('reset')
            $('#isDeckPublic').prop("checked",oldChecked)       //retains checkbock status for if deck is public or not
        })
    })
    //for deleting a deck
    $('#delete-deck').on('click',function (event) {
        event.preventDefault();
        let url=window.location.href.substring(window.location.href.indexOf("/yourpage"));     //gets deck id
        let id=url.substring(url.indexOf("/decks/")+7)
        let requestConfig = {
            method: "DELETE"
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                alert("Deck successfully deleted")
                window.location.href='/yourpage/decks'
            }
            else{
                alert(responseMessage.error)
            }
        })
    })
    //for creating a card
    $('#create-card-form').submit(function (event) {
        event.preventDefault();
        let cfi=$('#cardFrontInput').val().trim(); let cbi=$('#cardBackInput').val().trim();
        if(cfi && cbi){
            let requestConfig = {
                method: "POST",
                data:{front:cfi,back:cbi}
            }
            $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                errorDiv2.hidden=true
                let listItem=`<li><a href="${responseMessage.id}/${responseMessage.number}">${responseMessage.front} ||| ${responseMessage.back}</a></li>`
                $('#deck-list').append(listItem)
            }
            else{
                errorDiv2.hidden=false
                errorDiv2.innerText=responseMessage.error
                $('#cardFrontInput').focus()
            }
            $('#create-card-form').trigger('reset')
            }
        )}
    })
    //for editing a card
    $('#edit-card-form').submit(function (event) {
        event.preventDefault();
        let newFront=$('#cardFrontInput').val().trim(); let newBack=$('#cardBackInput').val().trim()
        if(newFront || newBack) {
            let requestConfig={
                method:"PATCH",
                data:{front:newFront,back:newBack}
            }
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success) {
                    errorDiv.hidden=true
                    $('#card-front-h1').replaceWith(`<h1 id="card-front-h1" class="card-front-h1">${responseMessage.cardFront}</h1>`)
                    $('#card-back-h2').replaceWith(`<h2 id="card-back-h2" class="card-back-h2">${responseMessage.cardBack}</h2>`)
                }
                else{
                    errorDiv.hidden=false
                    errorDiv.innerHTML=responseMessage.errorMessage
                    $('#cardFrontInput').focus();
                }
                $('#edit-card-form').trigger('reset')
            })
        }
    })
    //for deleting a card
    $('#delete-card').on('click', function (event) {
        event.preventDefault();
        //gets necessary info from url
        let url=window.location.href.substring(window.location.href.indexOf("/yourpage/decks/"));     //gets card url
        let idAndCard=url.substring(url.indexOf('/decks/')+7)
        let id=idAndCard.substring(0,idAndCard.indexOf('/'))
        let card=idAndCard.substring(idAndCard.indexOf("/")+1)
        let requestConfig={
            method: "DELETE",
            data:{cardNumber:card}
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                alert("Card successfully deleted!")
                window.location.href='/yourpage/decks/'+id
            }
            else{
                alert(responseMessage.errorMessage)
            }
        })
    })
    //for creating a folder
    $('#create-folder-form').submit(function (event) {
        event.preventDefault();
        let fni=$('#foldernameInput').val().trim();
        if(fni){
            let requestConfig = {
                method:"POST",
                data:{name:fni}
            }
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success){
                    errorDiv.hidden=true
                    let listItem=`<li><a href="folders/${responseMessage.id}">${responseMessage.name}</a></li>`
                    $('#folder-list').append(listItem)
                }
                else{
                    errorDiv.hidden=false
                    errorDiv.innerText=responseMessage.error     //error message thrown from routes (checking) is used here
                    $('#foldernameInput').focus();
                }
                $('#create-folder-form').trigger('reset')
            })
        }
    })
    //for editing a folder
    $('#edit-folder-form').submit(function (event) {
        event.preventDefault();
        let folderName=$('#foldernameInput').val().trim()
        let requestConfig={
            method:"PATCH",
            data:{newFolderName:folderName}
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                errorDiv.hidden=true
                $('#folderName').replaceWith(`<h1 id="folderName" class="deckName">${responseMessage.folderName}</h1>`)
            }
            else{
                errorDiv.hidden=false
                errorDiv.innerHTML=responseMessage.errorMessage
                $('#foldernameInput').focus()
            }
            $('#edit-folder-form').trigger('reset')
        })
    })
    //for deleting a folder
    $('#delete-folder').on('click', function (event) {
        event.preventDefault();
        let url=window.location.href.substring(window.location.href.indexOf("/yourpage"));     //gets deck id
        let id=url.substring(url.indexOf("/folders/")+9)
        let requestConfig = {
            method: "DELETE"
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                alert("Folder successfully deleted")
                window.location.href='/yourpage/folders'
            }
            else{
                alert(responseMessage.error)
            }
        })
    })
    //for adding a deck to a folder
    $('#add-deck-to-folder').submit(function (event) {
        event.preventDefault();
        let deckToAdd=$('#addDeck').val()
        if(deckToAdd && deckToAdd!=="<select deck>"){
            let requestConfig={
                method:"POST",
                data:{deckToAddName:deckToAdd}
            }
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success){
                    errorDiv2.hidden=true
                    let listItem=`<li><a href="/yourpage/decks/${responseMessage.id}">${responseMessage.deckName}</a> - [Subject]: ${responseMessage.subject}</li>`
                    $('#deck-list').append(listItem)
                }
                else{
                    errorDiv2.hidden=false
                    errorDiv2.innerText=responseMessage.error     //error message thrown from routes (checking) is used here 
                }
                $("#add-deck-to-folder").trigger('reset')
            })
        }
    })
    //for removing a deck from a folder
    $('#remove-deck-from-folder').submit(function (event) {
        event.preventDefault();
        let deckToRemove=$('#removeDeck').val()
        if(deckToRemove && deckToRemove!=="<select deck>"){
            let requestConfig={
                method:"DELETE",
                data:({deckToRemoveName:deckToRemove,removeDeck:true,deckList:$("#deck-list")[0].innerHTML})
            }
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success){
                    errorDiv3.hidden=true
                    $("#deck-list")[0].innerHTML=responseMessage.newDeckList        //replaces html with one that removed the deck
                }
                else{
                    errorDiv3.hidden=false
                    errorDiv3.innerText=responseMessage.error     //error message thrown from routes (checking) is used here 
                }
                $("#remove-deck-from-folder").trigger('reset')
            })
        }
    })
    //for saving a public deck
    $("#save-deck").on('click', function (event) {
        event.preventDefault()
        //let id=window.location.href.substring(window.location.href.indexOf('/publicdecks/')+13)     //gets deck id
        let requestConfig = {
            method:"POST"
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                errorDiv.hidden=true
                alert(`Public deck ${responseMessage.publicDeckName} was saved to your decks`)
            }
            else{
                errorDiv.hidden=false
                errorDiv.innerText=responseMessage.error
                //alert(responseMessage.error)
            }
        })
    })
    //for sending a deck to another user
    $("#send-deck-form").submit(function (event) {
        event.preventDefault()
        let user=$("#usernameInput").val().trim()
        if(user) {
            let requestConfig={
                method:"POST",
                data:{user:user,sendDeck:true}          //sendDeck is used to determine which route is run
            }
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success){
                    errorDiv3.hidden=true
                    alert(`This deck was sent to ${user}`)
                }
                else {
                    errorDiv3.hidden=false
                    errorDiv3.innerText=responseMessage.error
                }
                $('#send-deck-form').trigger('reset')
            })
        }
    })
    //for sorting decks
    $("#sort-decks-form").submit(function (event) {
        event.preventDefault()
        let sortBy=$('#sortDecksBy').val();
        if(sortBy){
            let requestConfig={
                method:"POST",
                data:{sortBy:sortBy,decksOnPage:$('#deck-list')[0].innerText.replace(/( - \[Subject\]:)/g,"")}
            }
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success){
                    let sorted=""           //takes the sorted decks from the request and builds the HTML
                    for(deck of responseMessage.sortedDecks){
                        sorted+=`<li><a href="decks/${deck.id}">${deck.name}</a> - [Subject]: ${deck.subject}</li>\n`
                    }
                    $('#deck-list')[0].innerHTML=sorted
                }
            })
        }
    })
    //for searching decks
    $('#filter-decks-form').submit(function (event) {
        event.preventDefault()
        let searchBy=$('#searchDecksInput').val().trim()
        if(!searchBy) searchBy=" "
        if(searchBy){
            let requestConfig={
                method:"POST",
                data:{searchBy:searchBy}
            }
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success){
                    let searched=""
                    for(deck of responseMessage.foundDecks){
                        searched+=`<li><a href="decks/${deck.id}">${deck.name}</a> - [Subject]: ${deck.subject}</li>\n`
                    }
                    $('#deck-list')[0].innerHTML=searched
                }
                $('#filter-decks-form').trigger('reset')
            })
        }
    })
})(window.jQuery)