// Expose functions to window object for global access
window.addCustomQuestionField = function() {
    const container = document.getElementById('customQuestionsContainer');
    if (!container) return;

    const questionIndex = container.children.length;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'custom-question';
    questionDiv.setAttribute('draggable', 'true');

    questionDiv.innerHTML = `
        <span class="drag-handle" title="Drag to reorder"><i class="fas fa-arrows-alt"></i></span>
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
    // re-init sortable so new element is draggable
    if (typeof initializeQuestionDrag === 'function') initializeQuestionDrag();
}

window.handleQuestionTypeChange = function(selectElem, index) {
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

window.removeCustomQuestionField = function(button) {
    const questionDiv = button.parentElement;
    if (questionDiv) {
        questionDiv.remove();
    }
}

window.getCustomQuestionsFromForm = function(formElement) {
    const container = formElement ? formElement.querySelector('#customQuestionsContainer') : document.getElementById('customQuestionsContainer');
    if (!container) return [];

    // ensure newest order (drag & drop may have changed DOM order)
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

// initialize drag-and-drop reordering using SortableJS (must include library in page)
window.initializeQuestionDrag = function() {
    const container = document.getElementById('customQuestionsContainer');
    if (container && typeof Sortable !== 'undefined') {
        Sortable.create(container, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost'
        });
    }
}
