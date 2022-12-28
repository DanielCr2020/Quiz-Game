(function ($) {
    //creating a deck
    let createDeckForm=$('#create-deck-form')
    let deckList=$('#deck-list')
    let deckNameInput=$('#decknameInput')
    let deckSubjectInput=$('#decksubjectInput')
    //editing a deck
    let editDeckForm=$('#edit-deck-form')
    //creating a card
    let createCardForm=$('#create-card-form')
    //errors
    let errorDiv=document.getElementById('error')
    let errorDiv2=document.getElementById('error2')

    //for creating a deck
    createDeckForm.submit(function (event) {
        event.preventDefault();
        let dni=deckNameInput.val().trim(); let dsi=deckSubjectInput.val().trim();
        if(dni && dsi){      //setting up request with name and subject
            let requestConfig = {
                method: "POST",
                url: "/yourpage/decks",
                data: {name:dni,subject:dsi}
            }
            $.ajax(requestConfig).then(function (responseMessage) {
                if(responseMessage.success) {
                    errorDiv.hidden=true
                    let listItem=`<li><a href="decks/${responseMessage.id}">${responseMessage.newName}</a> - Subject: ${responseMessage.subject}</li>`
                    deckList.append(listItem)
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
    editDeckForm.submit(function (event) {
        event.preventDefault();
        let dni=deckNameInput.val().trim(); let dsi=deckSubjectInput.val().trim();
        let oldChecked= !!($('#isDeckPublic').is(":checked"))           //old publicity status
        let url=window.location.href.substring(window.location.href.indexOf("/yourpage"));     //gets deck url
        let requestConfig = {
            method:"PATCH",
            url:url,
            contentType: "application/json",
            data:JSON.stringify({name:dni,subject:dsi,public:$('#isDeckPublic').is(":checked")})
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                errorDiv.hidden=true
                if(dni)
                    $('#deckName').replaceWith(`<h1 id="deckName" class="deckName">${responseMessage.deckName}</h1>`)
                if(dsi)
                    $('#deckSubject').replaceWith(`<h2 id=deckSubject class="deckSubject">${responseMessage.deckSubject}</h2>`)
            }
            else{
                errorDiv.hidden=false
                errorDiv.innerHTML=responseMessage.error
                deckNameInput.focus()
            }
            $('#edit-deck-form').trigger('reset')
            $('#isDeckPublic').prop("checked",oldChecked)
        })
    })
    //for deleting a deck
    $('#delete-deck').on('click',function (event) {
        event.preventDefault();
        let url=window.location.href.substring(window.location.href.indexOf("/yourpage"));     //gets deck id
        let id=url.substring(url.indexOf("/decks/")+7)
        let requestConfig = {
            method: "DELETE",
            contentType:"application/json",
            data:JSON.stringify({id:id})
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
    createCardForm.submit(function (event) {
        event.preventDefault();
        let cfi=$('#cardFrontInput').val().trim(); let cbi=$('#cardBackInput').val().trim();
        if(cfi && cbi){
            let url=window.location.href.substring(window.location.href.indexOf("/yourpage"));     //gets deck url
            let requestConfig = {
                method: "POST",
                url:url,
                data:{front:cfi,back:cbi}
            }
            $.ajax(requestConfig).then(function (responseMessage) {
            if(responseMessage.success){
                errorDiv2.hidden=true
                let listItem=`<li><a href="decks/${responseMessage.id}/${responseMessage.number}">${responseMessage.front} ||| ${responseMessage.back}</a></li>`
                deckList.append(listItem)
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
})(window.jQuery)