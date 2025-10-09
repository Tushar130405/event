function addCustomQuestionField() {
    const container = document.getElementById('customQuestionsContainer');
    if (!container) return;

    const questionIndex = container.children.length;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'custom-question';

    questionDiv.innerHTML = `
        <input type="text" name="customQuestions[${questionIndex}][question]" placeholder="Question" required />
        <select name="customQuestions[${questionIndex}][type]" onchange="handleQuestionTypeChange(this, ${questionIndex})" required>
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="select">Select</option>
            <option value="checkbox">Checkbox</option>
            <option value="radio">Radio</option>
        </select>
        <input type="text" name="customQuestions[${questionIndex}][options]" placeholder="Options (comma separated)" style="display:none;" />
        <button type="button" onclick="removeCustomQuestionField(this)">Remove</button>
    `;

    container.appendChild(questionDiv);
}

function handleQuestionTypeChange(selectElem, index) {
    const optionsInput = document.querySelector(`input[name="customQuestions[${index}][options]"]`);
    if (!optionsInput) return;

    if (['select', 'checkbox', 'radio'].includes(selectElem.value)) {
        optionsInput.style.display = 'inline-block';
        optionsInput.required = true;
    } else {
        optionsInput.style.display = 'none';
        optionsInput.required = false;
        optionsInput.value = '';
    }
}

function removeCustomQuestionField(button) {
    const questionDiv = button.parentElement;
    if (questionDiv) {
        questionDiv.remove();
    }
}

function getCustomQuestionsFromForm(formElement) {
    const container = formElement ? formElement.querySelector('#customQuestionsContainer') : document.getElementById('customQuestionsContainer');
    if (!container) return [];

    const questions = [];
    const questionDivs = container.querySelectorAll('.custom-question');

    questionDivs.forEach(div => {
        const questionInput = div.querySelector('input[type="text"]:not([name$="[options]"])');
        const typeSelect = div.querySelector('select');
        const optionsInput = div.querySelector('input[name$="[options]"]');

        if (questionInput && typeSelect) {
            const questionText = questionInput.value.trim();
            const type = typeSelect.value;
            let options = [];

            if (optionsInput && optionsInput.style.display !== 'none') {
                options = optionsInput.value.split(',').map(opt => opt.trim()).filter(opt => opt);
            }

            if (questionText) {
                questions.push({
                    question: questionText,
                    type: type,
                    options: options
                });
            }
        }
    });

    return questions;
}
