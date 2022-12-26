(function ($) {
    //creating a deck
    let createDeckForm=$('#create-deck-form')
    let deckList=$('#deck-list')
    let deckNameInput=$('#decknameInput')
    let deckSubjectInput=$('#decksubjectInput')
    
    //errors
    let errorDiv=document.getElementById('error')

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
})(window.jQuery)