(function ($) {
    //errors
    let errorDiv=document.getElementById('error')
    let errorDiv2=document.getElementById('error2')

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
                    let listItem=`<li><a href="decks/${responseMessage.id}">${responseMessage.newName}</a> - Subject: ${responseMessage.subject}</li>`
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
            method: "DELETE",
            data:{id:id}
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
            method: "DELETE",
            data:{id:id}
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
})(window.jQuery)