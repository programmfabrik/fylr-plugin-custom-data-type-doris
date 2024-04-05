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
                typ: data[this.name()].typ
            };
        }
    }

    Plugin.renderDetailOutput = function(data, top_level_data, opts) {
        const cdata = this.initData(data);

        if (this.__isValidData(cdata)) {
            return new CUI.Label({ text: this.__getDocumentLabel(cdata) });
        } else {
            return new CUI.EmptyLabel({ text: $$('custom.data.type.doris.edit.invalidEntry') });
        }
    }

    Plugin.renderEditorInput = function(data, top_level_data, opts) {
        const cdata = this.initData(data);

        const layoutElement = new CUI.HorizontalLayout({
            class: 'customPluginEditorLayout doris-plugin-layout',
            left: {},
            center: {},
            right: {}
        });

        this.__updateEditorInput(cdata, layoutElement);

        return layoutElement;
    }

    Plugin.__updateEditorInput = function(cdata, layoutElement) {
        layoutElement.replace(this.__getCreateDocumentButton(cdata, layoutElement), 'left');
        layoutElement.replace(this.__getContentElement(cdata, layoutElement), 'center');
        layoutElement.replace(this.__renderActionsButtonBar(cdata, layoutElement), 'right');
    }

    Plugin.__getCreateDocumentButton = function(cdata, layoutElement) {
        if (this.__isValidData(cdata)) return undefined;
        
        return new CUI.Button({
            text: '',
            icon: new CUI.Icon({ class: 'fa-plus' }),
            class: 'pluginDirectSelectEditSearchFylr create-document-button',
            onClick: () => this.__openCreateDocumentModal(cdata, layoutElement)
        });
    }

    Plugin.__openCreateDocumentModal = function(cdata, layoutElement) {
        const inputData = { typ: 'Akte' };

        const modal = new CUI.Modal({
            pane: {
                content: this.__getCreateDocumentForm(inputData),
                class: 'doris-plugin-modal-pane',
                header_left: new CUI.Label({ text: $$('custom.data.type.doris.createDocument.header') }),
                footer_right: [
                    new CUI.Button({
                        text: $$('custom.data.type.doris.createDocument.cancel'),
                        class: 'cui-dialog',
                        onClick: () => {
                            modal.hide();
                            modal.destroy();
                        }
                    }),
                    new CUI.Button({
                        text: $$('custom.data.type.doris.createDocument.confirm'),
                        class: 'cui-dialog',
                        primary: true,
                        onClick: () => {
                            this.__addNewDocument(inputData, cdata, layoutElement).then(() => {
                                modal.hide();
                                modal.destroy();
                            });
                        }
                    })
                ]
            }
        });

        modal.autoSize();

        return modal.show();
    }

    Plugin.__getCreateDocumentForm = function(inputData) {
        return new CUI.Form({
            data: inputData,
            fields: [{
                type: CUI.Input,
                name: 'az',
                form: {
                    label: $$('custom.data.type.doris.field.az')
                }
            }, {
                type: CUI.Input,
                name: 'gz3',
                form: {
                    label: $$('custom.data.type.doris.field.gz3'),
                }
            }, {
                type: CUI.Select,
                name: 'typ',
                form: {
                    label: $$('custom.data.type.doris.field.typ')
                },
                options: [
                    { text: $$('custom.data.type.doris.field.typ.options.default'), value: 'Akte' },
                    { text: $$('custom.data.type.doris.field.typ.options.other'), value: 'Anderer Typ' }
                ]
            }, {
                type: CUI.Input,
                name: 'content',
                textarea: true,
                form: {
                    label: $$('custom.data.type.doris.field.content')
                }
            }]
        }).start();
    }

    Plugin.__addNewDocument = function(inputData, cdata, layoutElement) {
        const newDocumentData = this.__buildNewDocumentData(inputData);

        return this.__createDocument(newDocumentData).then(result => {
            this.__addEntry(result.id, result.typ, cdata, layoutElement);
        });
    }

    Plugin.__createDocument = function(newDocumentData) {
        // TODO Create document via DoRIS REST API

        return new Promise(resolve => {
            resolve({
                id: newDocumentData.guid,   // TODO Use ROWNUMBER as id
                typ: newDocumentData.typ
            });
        })
    }

    Plugin.__buildNewDocumentData = function(inputData) {
        return {
            az: inputData.az,
            gz3: inputData.gz3,
            gzAkte: inputData.az + '-' + inputData.gz3,
            typ: inputData.typ,
            content: inputData.content,
            guid: this.__createGuid(),
            creationDate: this.__getCurrentDate(),
            creationTime: this.__getCurrentTime()
        };
    }

    Plugin.__createGuid = function() {
        return window.crypto.randomUUID().replaceAll('-', '').toUpperCase();
    }

    Plugin.__getCurrentDate = function() {
        const date = new Date();
        return this.__addZeroIfNecessary(date.getDate()) + '.'
            + this.__addZeroIfNecessary(date.getMonth()) + '.'
            + date.getFullYear();
    }

    Plugin.__getCurrentTime = function() {
        const date = new Date();
        return this.__addZeroIfNecessary(date.getHours()) + ':'
            + this.__addZeroIfNecessary(date.getMinutes());
    }

    Plugin.__addZeroIfNecessary = function(value) {
        return ('0' + value).slice(-2);
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
                    text: this.__getDocumentLabel(cdata),
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
            { id: 'id1', typ: 'Akte' },
            { id: 'id2', typ: 'Akte' },
            { id: 'id3', typ: 'Akte' },
            { id: 'id4', typ: 'Akte' },
            { id: 'id5', typ: 'Akte' }
        ];

        if (!searchString) return [];

        return documents.filter(document => document.id.startsWith(searchString));
    }

    Plugin.__getSuggestionItemList = function(suggestions, cdata, layoutElement, suggestionsMenu) {
        const items = suggestions.map(suggestion => {
            return {
                text: this.__getDocumentLabel(suggestion),
                value: suggestion
            };
        });

        return {
            items,
            keyboardControl: true,
            onClick: (_, button) => {
                const value = button.getOpt('value');
                this.__addEntry(value.id, value.typ, cdata, layoutElement);
                suggestionsMenu.hide();
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
                this.__getDetailInfoButton(cdata, menuElement),
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

    Plugin.__getDetailInfoButton = function(cdata, menuElement) {
        return {
            text: $$('custom.data.type.doris.buttonMenu.detailInfo'),
            value: 'detail',
            icon_left: new CUI.Icon({ class: 'fa-info-circle' }),
            onClick: (_, buttonElement) => this.__openDetailInfoTooltip(cdata, buttonElement, menuElement)
        };
    }

    Plugin.__openDetailInfoTooltip = function(cdata, buttonElement, menuElement) {
        const tooltip = new CUI.Tooltip({
            element: buttonElement,
            class: 'doris-plugin-detail-info-tooltip',
            placement: 'w',
            markdown: true,
            show_ms: 1000,
            hide_ms: 200,
            content: new CUI.Label({ icon: 'spinner', text: $$('custom.data.type.doris.detailInfo.loading') })
        }).show();

        CUI.Events.listen({
            type: ['click', 'dblclick', 'mouseout'],
            node: buttonElement,
            capture: true,
            only_once: true,
            call: () => menuElement.hide()
        });

        this.__getDetailInfoContent(cdata).then(content => {
            tooltip.DOM.innerHTML = content;
            tooltip.autoSize();
        });
    }

    Plugin.__getDetailInfoContent = function(cdata) {
        return new Promise(resolve => {
            this.__getDetailInfoData(cdata.id).then(data => {
                const content = '<h5>DoRIS:' + cdata.id + '</h5>'
                + '<div><b>' + $$('custom.data.type.doris.field.typ') + ': </b>'
                    + cdata.typ + '</div>'
                + '<div><b>' + $$('custom.data.type.doris.field.lastChangeDate') + ': </b>'
                    + data.lastChangeDate + '</div>'
                + '<div><b>' + $$('custom.data.type.doris.field.content') + ': </b>'
                    + data.content + '</div>'

                resolve(content);
            });
        });
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
                this.__updateEditorInput(cdata, layoutElement);
            }
        };
    }

    Plugin.__addEntry = function(id, typ, cdata, layoutElement) {
        cdata.id = id;
        cdata.typ = typ;
        cdata._fulltext = { text: id };
        cdata._standard = { text: id };

        this.__updateEditorInput(cdata, layoutElement);
        this.__notifyEditor(layoutElement);
    }

    Plugin.__deleteEntry = function(cdata, layoutElement) {
        delete cdata.id;
        delete cdata.typ;
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
        return cdata?.id && cdata?.typ;
    }

    Plugin.__getDocumentLabel = function(document) {
        return document.id + ' (' + document.typ + ')';
    }

    Plugin.__getDetailInfoData = function(id) {
         // TODO Get document information via DoRIS REST API

        return new Promise(resolve => {
            resolve({
                content: 'Example',
                lastChangeDate: '14.09.2023'
            });
        });
    }

    return CustomDataTypeDoRIS;
})(CustomDataType);


CustomDataType.register(CustomDataTypeDoRIS);
