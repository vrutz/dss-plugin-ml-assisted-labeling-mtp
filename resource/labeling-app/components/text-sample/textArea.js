import {config, UNDEFINED_COLOR, UNDEFINED_CAPTION} from "../utils/utils.js";


const TextArea = {
    name: 'TextArea',
    props: {
        text: String,
        objects: {
            type: Array,
            default: () => {
                return [];
            }
        },
        selectedLabel: String,
    },
    computed: {
        splittedText: function () {
            return this.splitText(this.text);
        }
    },
    methods: {
        splitText(txt) {
            return txt.split(' ').map(this.sanitizeWord).reduce((x, y) => x.concat(y));
        },
        sanitizeWord(word) {
            const sanitizedWordList = [];
            if (word.match(/^[a-zA-Z0-9]+$/i)) {
                sanitizedWordList.push(word);
            } else {
                let currentWord = '';
                word.split('').forEach((letter) => {
                    if (letter.match(/^[a-zA-Z0-9]+$/i)) {
                        currentWord = currentWord + letter;
                    } else {
                        currentWord && sanitizedWordList.push(currentWord);
                        sanitizedWordList.push(letter);
                        currentWord = '';
                    }
                })
                if (currentWord) sanitizedWordList.push(currentWord);
            }
            sanitizedWordList[sanitizedWordList.length - 1] += ' ';
            return sanitizedWordList;
        },
        updateHighlightingColor(newColor) {
            this.highlightingStyleCreated && document.head.removeChild(document.head.lastChild);
            const css = document.createElement('style');
            css.setAttribute('type', 'text/css')
            css.appendChild(document.createTextNode(`#textarea *::selection {background: ${newColor};}`));
            document.head.appendChild(css);
            this.highlightingStyleCreated = true;
        },
        addSelectionFromObject(o) {
            const category = config.categories[o.label];
            const ids = o.wordsIds;
            const selected = o.selected;
            this.makeSelected(ids, category, selected)
        },
        addSelection(ids) {
            const category = config.categories[this.selectedLabel];
            this.makeSelected(ids, category, false)
        },
        getTextFromWordIds(wordIds) {
            const selectedWords = wordIds.map((x) => document.getElementById(x));
            return selectedWords.map((x) => x.innerText).reduce((x, y) => x + y);
        },
        makeSelected(ids, category, selected) {
            const color = category ? category.color : UNDEFINED_COLOR;
            const colorStrTransparent = `rgb(${color[0]},${color[1]},${color[2]}, 0.25)`;
            const colorStrOpaque = `rgb(${color[0]},${color[1]},${color[2]})`;

            const caption = category ? category.caption : UNDEFINED_CAPTION;

            const selectedWords = ids.map((x) => document.getElementById(x));
            const selectionWrapper = document.createElement('mark');
            selectionWrapper.classList.add('selection-wrapper');
            selected && selectionWrapper.classList.add('selected');
            selectionWrapper.id = this.getSelectionId(ids);
            selectionWrapper.addEventListener('dblclick', () => {
                const newObjects = this.objects.filter((x) => this.getSelectionId(ids) !== this.getSelectionId(x.wordsIds));
                this.$emit("update:objects", newObjects);
            });
            selectionWrapper.addEventListener('click', () => {
                const obj = this.objects.filter((x) => this.getSelectionId(ids) === this.getSelectionId(x.wordsIds))[0];
                obj.selected = !obj.selected;
                this.updateObjectToObjectList(obj);
            });
            selectionWrapper.style.background = colorStrTransparent
            selectedWords[0].parentNode.insertBefore(selectionWrapper, selectedWords[0]);
            selectedWords.forEach((x) => selectionWrapper.appendChild(x));

            const captionSpan = document.createElement('span');
            captionSpan.classList.add('selected-caption');
            captionSpan.textContent = caption;
            captionSpan.style.color = colorStrOpaque
            selectionWrapper.appendChild(captionSpan);

        },
        getLabeledText(wordsIds) {
            return {
                label: this.selectedLabel,
                text: this.getTextFromWordIds(wordsIds),
                wordsIds: wordsIds,
                draft: false,
                selected: false
            }
        },
        updateObjectToObjectList(updatedObject) {
            const newObjectList = [];
            this.objects.forEach((o) => {
                newObjectList.push(this.getSelectionId(o.wordsIds) === this.getSelectionId(updatedObject.wordsIds) ? updatedObject : o)
            })
            this.$emit("update:objects", newObjectList);
        },
        addObjectToObjectList(newObject) {
            this.$emit("update:objects", this.objects ? this.objects.concat([newObject]) : [newObject]);
        },
        resetSelection() {
            const textarea = document.getElementById('textarea');
            textarea.innerHTML = "";
            this.splittedText.forEach((word, index) => {
                const newWord = document.createElement('span');
                newWord.textContent = word;
                newWord.classList.add('word');
                newWord.id = index;
                textarea.appendChild(newWord)
            })
        },
        handleMouseUp() {
            const selection = document.getSelection();
            if (selection.isCollapsed) return;
            const focusWord = parseInt(selection.focusNode.parentElement.id);
            const anchorWord = parseInt(selection.anchorNode.parentElement.id);
            let startSelect, endSelect;
            [startSelect, endSelect] = _.sortBy([anchorWord, focusWord]);
            const selectedWordIds = _.range(startSelect, endSelect + 1);
            this.addSelection(selectedWordIds);
            this.addObjectToObjectList(this.getLabeledText(selectedWordIds));
        },
        deleteAll() {
            this.$emit("update:objects", []);
        },
        getSelectionId(wordsIds) {
            return wordsIds ? wordsIds.join("_") : "0";
        }
    },
    watch: {
        selectedLabel: function (){
            const category = config.categories[this.selectedLabel];
            const color = category ? category.color : UNDEFINED_COLOR;
            const colorStr = `rgb(${color[0]},${color[1]},${color[2]}, 0.5)`;
            this.updateHighlightingColor(colorStr);
        },
        objects: {
            handler(nv) {
                if (!nv) {
                    return;
                }
                this.resetSelection();
                nv.map(this.addSelectionFromObject);
            },
            deep: true
        },
    },
    mounted() {
        this.resetSelection();
        if (this.objects) {
            this.objects.map((o) => this.addSelectionFromObject(o));
        }
    },
    // language=HTML
    template: `
        <div clss="labeling-window">
            <div class="textarea-wrapper" ref="wrapper" v-on:mouseup="handleMouseUp">
                <div class="textarea" id="textarea"></div>
            </div>
            <div class="textarea__button-wrapper">
                <button @click="deleteAll()" class="main-area-element"><i class="icon-trash"></i>Delete all</button>
            </div>
        </div>`
};

export {TextArea}