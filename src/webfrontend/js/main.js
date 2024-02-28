var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp = {}.hasOwnProperty;

var CustomDataTypeDoRIS = (function(superClass) {
	extend(CustomDataTypeDoRIS, superClass);

	function CustomDataTypeDoRIS() {
		return CustomDataTypeDoRIS.__super__.constructor.apply(this, arguments);
	}

    const Plugin = CustomDataTypeDoRIS.prototype;

    Plugin.getCustomDataTypeName = function() {
        return 'custom:base.custom-data-type-doris.doris';
    }

    Plugin.getCustomDataTypeNameLocalized = function() {
        return $$('custom.data.type.doris.name');
    }

    Plugin.isEmpty = function(data, top_level_data, opts={}) {
        if (data[this.name()]?.id) {
            return false;
        } else {
            return true;
        }
    }

    Plugin.getCustomDataOptionsInDatamodelInfo = function(custom_settings) {
        return [];
    }

    Plugin.initData = function(data) {
        let cdata;

        if (!data[this.name()]) {
            cdata = {};
            data[this.name()] = cdata;
        } else {
            cdata = data[this.name()];
        }

        return cdata;
    }

    Plugin.renderFieldAsGroup = function(data, top_level_data, opts) {
        return false;
    }

    Plugin.supportsFacet = function() {
        return false;
    }

    Plugin.getSaveData = function(data, save_data, opts = {}) {
        if (this.isEmpty(data)) {
            save_data[this.name()] = null;
        } else {
            save_data[this.name()] = {
                id: data[this.name()].id,
                gzAkte: data[this.name()].gzAkte
            };
        }
    }

    Plugin.renderDetailOutput = function(data, top_level_data, opts) {
        const cdata = this.initData(data);

        if (this.__isValidData(cdata)) {
            return new CUI.Label({ text: cdata.gzAkte });
        } else {
            return new CUI.EmptyLabel({ text: $$('custom.data.type.doris.edit.invalidEntry') });
        }
    }

    Plugin.renderEditorInput = function(data, top_level_data, opts) {
        const cdata = this.initData(data);

        const layoutElement = new CUI.HorizontalLayout({
            class: 'customPluginEditorLayout doris-plugin-layout',
            center: {},
            right: {}
        });

        layoutElement.replace(this.__getContentElement(cdata, layoutElement), 'center');
        layoutElement.replace(this.__renderActionsButtonBar(cdata, layoutElement), 'right');

        return layoutElement;
    }

    Plugin.__getContentElement = function(cdata, layoutElement) {
        return cdata?.id
            ? this.__renderDocumentInfo(cdata)
            : this.__renderInputField(cdata, layoutElement);
    }

    Plugin.__renderDocumentInfo = function(cdata) {
        return new CUI.VerticalLayout({
            class: 'ez5-info_commonPlugin',
            top: {
                content: new CUI.Label({
                    text: cdata.gzAkte,
                    multiline: true
                })
            }
        });
    }

    Plugin.__renderInputField = function(cdata, layoutElement) {
        const inputElement = new CUI.Input({
            name: 'directSelectInput',
            class: 'pluginDirectSelectEditInput',
            undo_and_changed_support: false,
            content_size: false,
            onKeyup: input => {
                this.__triggerSuggestionsUpdate(suggestionsMenu, input.getValueForInput(), cdata, layoutElement);
            }
        });

        const suggestionsMenu = this.__getSuggestionsMenu(inputElement);

        return inputElement.start();
    }

    Plugin.__getSuggestionsMenu = function(inputElement) {
        return new CUI.Menu({
            class: 'customDataTypeCommonsMenu',
            element: inputElement,
            use_element_width_as_min_width: true
        });
    }

    Plugin.__triggerSuggestionsUpdate = function(suggestionsMenu, searchString, cdata, layoutElement) {
        if (this.currentTimeout) clearTimeout(this.currentTimeout);
        this.currentTimeout = setTimeout(() => {
            this.__updateSuggestionsMenu(suggestionsMenu, searchString, cdata, layoutElement);
            this.currentTimeout = undefined;
        }, 500);
    }

    Plugin.__updateSuggestionsMenu = function(suggestionsMenu, searchString, cdata, layoutElement) {
        const suggestions = this.__getSuggestions(searchString);

        if (suggestions.length > 0) {
            suggestionsMenu.setItemList(
                this.__getSuggestionItemList(suggestions, cdata, layoutElement, suggestionsMenu)
            );
            suggestionsMenu.show();
        } else {
            suggestionsMenu.hide();
        }
    }

    Plugin.__getSuggestions = function(searchString) {
        // TODO Fetch suggestions via DoRIS REST API
        const documents = [
            { id: 'id1', gzAkte: '1.01.01-200' },
            { id: 'id2', gzAkte: '1.01.01-201' },
            { id: 'id3', gzAkte: '1.01.01-202' },
            { id: 'id4', gzAkte: '1.01.01-203' },
            { id: 'id5', gzAkte: '1.01.01-204' }
        ];

        if (!searchString) return [];

        return documents.filter(document => {
            return document.id.startsWith(searchString) || document.gzAkte.startsWith(searchString);
        });
    }

    Plugin.__getSuggestionItemList = function(suggestions, cdata, layoutElement, suggestionsMenu) {
        const items = suggestions.map(suggestion => {
            return { text: suggestion.gzAkte, value: suggestion.id };
        });

        return {
            items,
            keyboardControl: true,
            onClick: (_, button) => {
                const id = button.getOpt('value');
                const gzAkte = button.getText();
                this.__addEntry(id, gzAkte, cdata, layoutElement);
                suggestionsMenu.hide();
                layoutElement.replace(this.__getContentElement(cdata, layoutElement), 'center');
            }
        };
    }

    Plugin.__renderActionsButtonBar = function(cdata, layoutElement) {
        return new CUI.Buttonbar({
            buttons: [this.__renderActionsButton(cdata, layoutElement)]
        });
    }

    Plugin.__renderActionsButton = function(cdata, layoutElement) {
        const menuButtonElement = new CUI.Button({
            text: '',
            icon: new CUI.Icon({ class: 'fa-ellipsis-v' }),
            class: 'pluginDirectSelectEditSearchFylr',
            onClick: () => this.__openActionsMenu(cdata, menuElement)
        });

        const menuElement = this.__getActionsMenu(cdata, menuButtonElement, layoutElement);

        return menuButtonElement;
    }

    Plugin.__getActionsMenu = function(cdata, menuButtonElement, layoutElement) {
        const menuElement = new CUI.Menu({
            class: 'customDataTypeCommonsMenu',
            element: menuButtonElement
        });

        menuElement._auto_close_after_click = false;
        menuElement.setItemList(this.__getActionsMenuItemList(cdata, menuElement, layoutElement));
        return menuElement;
    }

    Plugin.__getActionsMenuItemList = function(cdata, menuElement, layoutElement) {
        return {
            items: [
                this.__getDetailInfoButton(),
                this.__getEditButton(),
                this.__getDeleteButton(cdata, menuElement, layoutElement)
            ]
        };
    }

    Plugin.__openActionsMenu = function(cdata, menuElement) {
        menuElement.getItemList().getItems().done(items => {
            items.forEach(item => item.disabled = !this.__isValidData(cdata));
            menuElement.show();
        });
    }

    Plugin.__getDetailInfoButton = function() {
        return {
            text: $$('custom.data.type.doris.buttonMenu.detailInfo'),
            value: 'detail',
            icon_left: new CUI.Icon({ class: 'fa-info-circle' }),
            onClick: () => {
                // TODO Implement
            }
        };
    }

    Plugin.__getEditButton = function() {
        return {
            text: $$('custom.data.type.doris.buttonMenu.edit'),
            value: 'edit',
            icon_left: new CUI.Icon({ class: 'fa-pencil' }),
            onClick: () => {
                // TODO Implement
            }
        };
    }

    Plugin.__getDeleteButton = function(cdata, menuElement, layoutElement) {
        return {
            text: $$('custom.data.type.doris.buttonMenu.delete'),
            value: 'delete',
            icon_left: new CUI.Icon({ class: 'fa-trash' }),
            onClick: () => {
                this.__deleteEntry(cdata, layoutElement);
                menuElement.hide();
                layoutElement.replace(this.__getContentElement(cdata, layoutElement), 'center');
            }
        };
    }

    Plugin.__addEntry = function(id, gzAkte, cdata, layoutElement) {
        cdata.id = id;
        cdata.gzAkte = gzAkte;
        cdata._fulltext = { text: gzAkte }
        cdata._standard = { text: gzAkte }

        this.__notifyEditor(layoutElement);
    }

    Plugin.__deleteEntry = function(cdata, layoutElement) {
        delete cdata.id;
        delete cdata.gzAkte;
        delete cdata._fulltext;
        delete cdata._standard;

        this.__notifyEditor(layoutElement);
    }

    Plugin.__notifyEditor = function(layoutElement) {
        CUI.Events.trigger({
            node: layoutElement,
            type: 'editor-changed'
        });

        CUI.Events.trigger({
            node: layoutElement,
            type: 'data-changed'
        });
    }

    Plugin.__isValidData = function(cdata) {
        return cdata?.id && cdata?.gzAkte;
    }

    return CustomDataTypeDoRIS;
})(CustomDataType);


CustomDataType.register(CustomDataTypeDoRIS);
