var form= document.getElementById('tabelaGerada')
form.addEventListener('submit',function(event){
    event.preventDefault();
    var inputs = form.querySelectorAll('input[type="number"]');
    var selects = form.querySelectorAll('select');
    
    var valores = {}

    inputs.forEach(function(input) {
        // Adiciona os valores ao objeto 'valores' usando o 'name' como chave
        valores[input.name] = input.value;
    });

    selects.forEach(function(input) {
        // Adiciona os valores ao objeto 'valores' usando o 'name' como chave
        valores[input.name] = input.value;
    });

    var jsonString = JSON.stringify(valores);

    // Exibe a string JSON no console para verificação
    console.log('Valores dos Inputs e Selects em JSON:', jsonString);

})