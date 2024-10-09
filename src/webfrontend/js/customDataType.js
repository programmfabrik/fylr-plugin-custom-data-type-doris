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
    };

    Plugin.getCustomDataTypeNameLocalized = function() {
        return $$('custom.data.type.doris.name');
    };

    Plugin.isEmpty = function(data, top_level_data, opts={}) {
        if (data[this.name()]?.id) {
            return false;
        } else {
            return true;
        }
    };

    Plugin.getCustomDataOptionsInDatamodelInfo = function(custom_settings) {
        return [];
    };

    Plugin.initData = function(data) {
        let cdata;

        if (!data[this.name()]) {
            cdata = {};
            data[this.name()] = cdata;
        } else {
            cdata = data[this.name()];
        }

        return cdata;
    };

    Plugin.renderFieldAsGroup = function(data, top_level_data, opts) {
        return false;
    };

    Plugin.supportsFacet = function() {
        return false;
    };

    Plugin.renderSearchInput = function(data, opts) {
        const inputElement = new CUI.Input({
            data: data,
            name: this.name(),
            placeholder: $$('custom.data.type.doris.search.placeholder')
        });

        CUI.Events.listen({
            node: inputElement,
            type: 'data-changed',
            call: () => {
                CUI.Events.trigger({
                    node: inputElement,
                    type: 'search-input-change'
                });
            }
        });

        return inputElement.start();
    }

    Plugin.getSearchFilter = function(data, key = this.name()) {
        if (data[key + ':unset']) {
            return {
                type: 'in',
                bool: 'should',
                fields: [this.path() + '.' + this.name() + '.id'],
                in: [null],
                _unnest: true,
                _unset_filter: true
            };
        } else if (data[key]?.length) {
            return {
                type: 'match',
                bool: 'should',
                fields: [this.path() + '.' + this.name() + '.id'],
                string: data[key].replace('DoRIS:', '')
            };
        }
    }

    Plugin.getQueryFieldBadge = function(data) {
        return {
            name: this.nameLocalized(),
            value: data[this.name()]?.length
                ? data[this.name()]
                : $$('custom.data.type.doris.search.badge.without')
        };
    }

    Plugin.getSaveData = function(data, save_data, opts = {}) {
        if (this.isEmpty(data)) {
            save_data[this.name()] = null;
        } else {
            save_data[this.name()] = {
                id: data[this.name()].id,
                type: data[this.name()].type,
                fileType: data[this.name()].fileType
            };
        }
    };

    Plugin.renderDetailOutput = function(data, top_level_data, opts) {
        const cdata = this.initData(data);

        if (this.__isValidData(cdata)) {
            return this.__getDocumentEntry(cdata, this.__getDoRISConfiguration());
        } else {
            return new CUI.EmptyLabel({ text: $$('custom.data.type.doris.edit.invalidEntry') });
        }
    };

    Plugin.__getDocumentEntry = function(cdata, dorisConfiguration) {
        const container = CUI.dom.div();

        CUI.dom.append(container, new CUI.Label({ text: this.__getDocumentLabel(cdata) }));
        if (this.__hasLoginData(dorisConfiguration)) {
            CUI.dom.append(container, this.__getDetailInfoIconButton(cdata, dorisConfiguration));
        }

        return container;
    }

    Plugin.__getDetailInfoIconButton = function(cdata, dorisConfiguration) {
        return new CUI.ButtonHref({
            class: 'doris-plugin-detail-info-icon',
            text: '',
            icon: new CUI.Icon({ class: 'fa-info-circle' }),
            onClick: (_, buttonElement) => this.__openDetailInfoTooltip(cdata, buttonElement, dorisConfiguration)
        });
    };

    Plugin.renderEditorInput = function(data, topLevelData, opts) {
        const cdata = this.initData(data);

        const layoutElement = new CUI.HorizontalLayout({
            class: 'customPluginEditorLayout doris-plugin-layout',
            left: {},
            center: {},
            right: {}
        });

        this.__updateEditorInput(topLevelData, cdata, layoutElement, this.__getDoRISConfiguration());

        return layoutElement;
    };

    Plugin.__updateEditorInput = function(data, cdata, layoutElement, dorisConfiguration) {
        layoutElement.replace(this.__getCreateDocumentButton(data, cdata, layoutElement, dorisConfiguration), 'left');
        layoutElement.replace(this.__getContentElement(data, cdata, layoutElement, dorisConfiguration), 'center');
        layoutElement.replace(this.__renderActionsButtonBar(data, cdata, layoutElement, dorisConfiguration), 'right');
    };

    Plugin.__getCreateDocumentButton = function(data, cdata, layoutElement, dorisConfiguration) {
        if (this.__isValidData(cdata)) return undefined;
        
        return new CUI.Button({
            text: '',
            icon: new CUI.Icon({ class: 'fa-plus' }),
            class: 'pluginDirectSelectEditSearchFylr create-document-button',
            disabled: !this.__hasLoginData(dorisConfiguration),
            onClick: () => this.__openCreateDocumentModal(data, cdata, layoutElement, dorisConfiguration)
        });
    };

    Plugin.__openCreateDocumentModal = function(data, cdata, layoutElement, dorisConfiguration) {
        const types = this.__getBaseConfiguration().types;
        const inputData = { type: types[0].id };

        const modal = new CUI.Modal({
            pane: {
                content: this.__getCreateDocumentForm(types, inputData),
                class: 'doris-plugin-create-document-modal',
                header_left: new CUI.Label({ text: $$('custom.data.type.doris.createDocument.header') }),
                footer_right: [
                    new CUI.Button({
                        text: $$('custom.data.type.doris.createDocument.cancel'),
                        class: 'cui-dialog',
                        onClick: () => this.__closeModal(modal)
                    }),
                    new CUI.Button({
                        text: $$('custom.data.type.doris.createDocument.confirm'),
                        class: 'cui-dialog',
                        primary: true,
                        onClick: () => {
                            const selectedType = types.find(type => inputData.type === type.id);
                            this.__closeModal(modal);

                            const creationInProgressModal = this.__openCreationInProgressModal();
                            this.__addNewDocument(selectedType, data, cdata, layoutElement, dorisConfiguration).finally(() => {
                                this.__closeModal(creationInProgressModal);
                            });
                        }
                    })
                ]
            }
        });

        modal.autoSize();

        return modal.show();
    };

    Plugin.__getCreateDocumentForm = function(types, inputData) {
        return new CUI.Form({
            data: inputData,
            fields: [{
                type: CUI.Select,
                class: 'doris-plugin-type-select',
                name: 'type',
                form: {
                    label: $$('custom.data.type.doris.field.type')
                },
                options: types.map(type => { return { text: type.label, value: type.id }; })
            }]
        }).start();
    };

    Plugin.__openCreationInProgressModal = function() {
        const modal = new CUI.Modal({
            pane: {
                header_left: new CUI.Label({ text: $$('custom.data.type.doris.createDocument.header') }),
                content: new CUI.Label({ icon: 'spinner', text: $$('custom.data.type.doris.creationInProgress.info') })
            }
        });

        modal.autoSize();

        return modal.show();   
    };

    Plugin.__addNewDocument = function(type, data, cdata, layoutElement, dorisConfiguration) {
        return this.__createDocument(this.__buildNewDocumentData(type, data), dorisConfiguration)
            .then(result => {
                if (result) this.__addEntry(result.id, 'Akte', result.type, data, cdata, layoutElement, dorisConfiguration);
            });
    };

    Plugin.__buildNewDocumentData = function(type, data) {
        return {
            type,
            content: this.__getNewDocumentContent(data),
            guid: this.__createGuid(),
            creationYear: new Date().getFullYear().toString(),
            creationDate: this.__getCurrentDate(),
            creationTime: this.__getCurrentTime()
        };
    };

    Plugin.__getNewDocumentContent = function(data) {
        const objectType = this.__getObjectType();
        const region = this.__getRegion(data, objectType);
        const cityDistrict = this.__getListValueFromObjectData(
            data, objectType, '_nested:' + objectType + '__politische_zugehoerigkeit', 'stadtteil'
        ) || '?';
        const street = this.__getListValueFromObjectData(data, objectType, '_nested:' + objectType + '__anschrift', 'strasse') || '?';
        const buildingNumber = this.__getListValueFromObjectData(data, objectType, '_nested:' + objectType + '__anschrift', 'hausnummer') || '?';
        const type = data.lk_objekttyp?.conceptName || '?';
        const title = this.__getListValueFromObjectData(data, objectType, '_nested:' + objectType + '__titel', 'titel') || '?';

        return (region || '?') + ', '
            + cityDistrict + ', '
            + street + ' ' + buildingNumber + ', ' 
            + type + ', '
            + title;
    };

    Plugin.__getRegion = function(data, objectType) {
        const danteConcept = this.__getListValueFromObjectData(
            data, objectType, '_nested:' + objectType + '__politische_zugehoerigkeit', 'lk_politische_zugehoerigkeit'
        )?.conceptName;
        if (!danteConcept) return undefined;

        const elements = danteConcept.split(' ➔ ');
        if (elements.length < 2) return undefined;

        let result = 'Landkreis ' + elements[1];
        if (elements.length > 2) result += ', Gemeinde ' + elements[2];
        if (elements.length > 3) result += ', Gemarkung ' + elements[3];

        return result;
    };

    Plugin.__getListValueFromObjectData = function(data, objectType, fieldName, subfieldName) {
        return data[objectType]?.[fieldName]?.length
            ? data[objectType][fieldName][0][subfieldName]
            : undefined;
    };

    Plugin.__createGuid = function() {
        return window.crypto.randomUUID().replaceAll('-', '').toUpperCase();
    };

    Plugin.__getCurrentDate = function() {
        const date = new Date();
        return this.__addZeroIfNecessary(date.getDate()) + '.'
            + this.__addZeroIfNecessary(date.getMonth()) + '.'
            + date.getFullYear();
    };

    Plugin.__getCurrentTime = function() {
        const date = new Date();
        return this.__addZeroIfNecessary(date.getHours()) + ':'
            + this.__addZeroIfNecessary(date.getMinutes());
    };

    Plugin.__addZeroIfNecessary = function(value) {
        return ('0' + value).slice(-2);
    };

    Plugin.__getContentElement = function(data, cdata, layoutElement, dorisConfiguration) {
        return cdata?.id
            ? this.__renderDocumentInfo(cdata)
            : this.__renderInputField(data, cdata, layoutElement, dorisConfiguration);
    };

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
    };

    Plugin.__renderInputField = function(data, cdata, layoutElement, dorisConfiguration) {
        const container = CUI.dom.div();

        const inputElement = new CUI.Input({
            name: 'directSelectInput',
            class: 'pluginDirectSelectEditInput',
            undo_and_changed_support: false,
            content_size: false,
            disabled: !this.__hasLoginData(dorisConfiguration),
            onKeyup: input => {
                this.__triggerSuggestionsUpdate(
                    suggestionsMenu, loadingIcon, input.getValueForInput(), data, cdata, layoutElement, dorisConfiguration
                );
            }
        });

        const suggestionsMenu = this.__getSuggestionsMenu(inputElement);
        const loadingIcon = this.__getSuggestionsLoadingIcon();

        CUI.dom.append(container, inputElement.start());
        CUI.dom.append(container, loadingIcon);

        return container;
    };

    Plugin.__getSuggestionsMenu = function(inputElement) {
        return new CUI.Menu({
            class: 'customDataTypeCommonsMenu',
            element: inputElement,
            use_element_width_as_min_width: true
        });
    };

    Plugin.__getSuggestionsLoadingIcon = function() {
        const loadingIcon = new CUI.Label({
            class: 'doris-plugin-suggestions-loading-icon',
            icon: 'spinner',
            text: ''
        });
        loadingIcon.hide();
        
        return loadingIcon;
    };

    Plugin.__triggerSuggestionsUpdate = function(suggestionsMenu, loadingIcon, searchString, data, cdata, layoutElement, dorisConfiguration) {
        if (this.currentTimeout) clearTimeout(this.currentTimeout);
        this.currentTimeout = setTimeout(() => {
            loadingIcon.show();
            this.__updateSuggestionsMenu(suggestionsMenu, loadingIcon, searchString, data, cdata, layoutElement, dorisConfiguration);
            this.currentTimeout = undefined;
        }, 500);
    };

    Plugin.__updateSuggestionsMenu = function(suggestionsMenu, loadingIcon, searchString, data, cdata, layoutElement, dorisConfiguration) {
        const suggestionsPromise = this.__getSuggestions(searchString, dorisConfiguration);
        this.activeSuggestionsPromise = suggestionsPromise;

        suggestionsPromise.then(suggestions => {
            if (this.activeSuggestionsPromise !== suggestionsPromise) return;
            if (suggestions?.length) {
                suggestionsMenu.setItemList(
                    this.__getSuggestionItemList(suggestions, data, cdata, layoutElement, suggestionsMenu, dorisConfiguration)
                );
                suggestionsMenu.show();
            } else {
                suggestionsMenu.hide();
            }
        }).finally(() => {
            loadingIcon.hide();
        });
    };

    Plugin.__getSuggestions = function(searchString, dorisConfiguration) {
        const query = this.__getSuggestionsQuery(searchString);
        if (!query) return Promise.resolve([]);
        
        return this.__getDoRISQueryResult(query, ['ROWNUMBER', 'TYP', 'AKTENTYP'], dorisConfiguration).then(data => {
            return data
                ? data.map(documentValues => {
                    return {
                        id: documentValues[0],
                        type: documentValues[1],
                        fileType: documentValues[2]
                    };
                }) : [];
        });
    };

    Plugin.__getSuggestionsQuery = function(searchString) {
        searchString = this.__prepareSearchString(searchString);
        if (!searchString) return undefined;

        let query = 'ROWNUMBER:' + searchString;
        let additionalDigits = 0;

        while (++additionalDigits + searchString.length <= 7) {
            query += ',' + this.__decrement(searchString + '0'.repeat(additionalDigits))
                + '<>' + this.__increment(searchString + '9'.repeat(additionalDigits));
        }

        return query + ';';
    };

    Plugin.__increment = function(number) {
        return (parseInt(number) + 1).toString();
    };

    Plugin.__decrement = function(number) {
        return (parseInt(number) - 1).toString();
    };

    Plugin.__prepareSearchString = function(searchString) {
        if (!searchString) return undefined;
    
        let result = searchString.toLowerCase().replace('doris:', '');    
        if (!/^\d+$/.test(result)) return undefined;

        result = parseInt(result).toString();
        return result?.length <= 7 && result !== '0' ? result : undefined;
    }

    Plugin.__getSuggestionItemList = function(suggestions, data, cdata, layoutElement, suggestionsMenu, dorisConfiguration) {
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
                this.__addEntry(value.id, value.type, value.fileType, data, cdata, layoutElement, dorisConfiguration);
                suggestionsMenu.hide();
            }
        };
    };

    Plugin.__renderActionsButtonBar = function(data, cdata, layoutElement, dorisConfiguration) {
        return new CUI.Buttonbar({
            buttons: [this.__renderActionsButton(data, cdata, layoutElement, dorisConfiguration)]
        });
    };

    Plugin.__renderActionsButton = function(data, cdata, layoutElement, dorisConfiguration) {
        const menuButtonElement = new CUI.Button({
            text: '',
            icon: new CUI.Icon({ class: 'fa-ellipsis-v' }),
            class: 'pluginDirectSelectEditSearchFylr',
            onClick: () => this.__openActionsMenu(cdata, menuElement, dorisConfiguration)
        });

        const menuElement = this.__getActionsMenu(data, cdata, menuButtonElement, layoutElement, dorisConfiguration);

        return menuButtonElement;
    };

    Plugin.__getActionsMenu = function(data, cdata, menuButtonElement, layoutElement, dorisConfiguration) {
        const menuElement = new CUI.Menu({
            class: 'customDataTypeCommonsMenu',
            element: menuButtonElement
        });

        menuElement._auto_close_after_click = false;
        menuElement.setItemList(this.__getActionsMenuItemList(data, cdata, menuElement, layoutElement, dorisConfiguration));
        return menuElement;
    };

    Plugin.__getActionsMenuItemList = function(data, cdata, menuElement, layoutElement, dorisConfiguration) {
        return {
            items: [
                this.__getDetailInfoButton(cdata, menuElement, dorisConfiguration),
                this.__getEditButton(cdata, dorisConfiguration),
                this.__getDeleteButton(data, cdata, menuElement, layoutElement, dorisConfiguration)
            ]
        };
    };

    Plugin.__openActionsMenu = function(cdata, menuElement, dorisConfiguration) {
        const disabled = !this.__isValidData(cdata) || !this.__hasLoginData(dorisConfiguration);
        menuElement.getItemList().getItems().done(items => {
            items.forEach(item => item.disabled = disabled);
            menuElement.show();
        });
    };

    Plugin.__getDetailInfoButton = function(cdata, menuElement, dorisConfiguration) {
        return {
            text: $$('custom.data.type.doris.buttonMenu.detailInfo'),
            value: 'detail',
            icon_left: new CUI.Icon({ class: 'fa-info-circle' }),
            onClick: (_, buttonElement) =>
                this.__openDetailInfoTooltip(cdata, buttonElement, dorisConfiguration, menuElement)
        };
    };

    Plugin.__openDetailInfoTooltip = function(cdata, buttonElement, dorisConfiguration, menuElement) {
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
            call: () => menuElement ? menuElement.hide() : tooltip.hide()
        });

        this.__getDetailInfoContent(cdata, dorisConfiguration).then(content => {
            tooltip.DOM.innerHTML = content;
            tooltip.autoSize();
        });
    };

    Plugin.__getDetailInfoContent = function(cdata, dorisConfiguration) {
        return this.__getDoRISDocument('ROWNUMBER: ' + cdata.id + ';', dorisConfiguration).then(data => {
            return '<h5>' + $$('custom.data.type.doris.field.dorisId') + ': ' + cdata.id + '</h5>'
            + '<div><b>' + $$('custom.data.type.doris.field.documentReference') + ': </b>'
                + data.documentReference + '</div>'
            + '<div><b>' + $$('custom.data.type.doris.field.type') + ': </b>'
                + (cdata.fileType ?? cdata.type) + '</div>'
            + '<div><b>' + $$('custom.data.type.doris.field.content') + ': </b>'
                + data.content + '</div>'
            + '<div><b>' + $$('custom.data.type.doris.field.lastChangeDate') + ': </b>'
                + data.changeDate + ', ' + data.changeTime + ' '
                + $$('custom.data.type.doris.field.lastChangeDate.suffix') + ' </div>';
        });
    };

    Plugin.__getEditButton = function(cdata, dorisConfiguration) {
        const editUrl = dorisConfiguration.url + 'cust/nld/DA/jsp/index.jsp?View=ListView&RowNumber=' + cdata.id;

        return {
            text: $$('custom.data.type.doris.buttonMenu.edit'),
            value: 'edit',
            icon_left: new CUI.Icon({ class: 'fa-pencil' }),
            onClick: () => {
                window.open(editUrl, '_blank');
            }
        };
    };

    Plugin.__getDeleteButton = function(data, cdata, menuElement, layoutElement, dorisConfiguration) {
        return {
            text: $$('custom.data.type.doris.buttonMenu.delete'),
            value: 'delete',
            icon_left: new CUI.Icon({ class: 'fa-trash' }),
            onClick: () => {
                this.__deleteEntry(cdata, layoutElement);
                menuElement.hide();
                this.__updateEditorInput(data, cdata, layoutElement, dorisConfiguration);
            }
        };
    };

    Plugin.__addEntry = function(id, type, fileType, data, cdata, layoutElement, dorisConfiguration) {
        cdata.id = id;
        cdata.type = type;
        cdata.fileType = fileType;
        cdata._fulltext = { text: id };
        cdata._standard = { text: id };

        this.__updateEditorInput(data, cdata, layoutElement, dorisConfiguration);
        this.__notifyEditor(layoutElement);
    };

    Plugin.__deleteEntry = function(cdata, layoutElement) {
        delete cdata.id;
        delete cdata.type;
        delete cdata.fileType;
        delete cdata._fulltext;
        delete cdata._standard;

        this.__notifyEditor(layoutElement);
    };

    Plugin.__notifyEditor = function(layoutElement) {
        CUI.Events.trigger({
            node: layoutElement,
            type: 'editor-changed'
        });

        CUI.Events.trigger({
            node: layoutElement,
            type: 'data-changed'
        });
    };

    Plugin.__isValidData = function(cdata) {
        return cdata?.id && cdata?.type;
    };

    Plugin.__getDocumentLabel = function(document) {
        return 'DoRIS:' + document.id + ' (' + (document.fileType?.length ? document.fileType : document.type) + ')';
    };

    Plugin.__createDocument = function(newDocumentData, dorisConfiguration) {
        const organizationUnit = this.__getOrganizationUnit(newDocumentData, dorisConfiguration);
        if (!organizationUnit) {
            this.__showErrorMessage('missingOrganizationUnit');
            return Promise.resolve(undefined);
        }

        return this.__updateLfdNrInDoRIS(newDocumentData, dorisConfiguration).then(lfdNr => {
            if (!lfdNr) throw 'dorisUpdateFailure';
            newDocumentData.lfdNr = lfdNr;
            return this.__addDoRISDocument(newDocumentData, dorisConfiguration, organizationUnit);
        }).then(result => {
            if (!result) throw 'dorisUpdateFailure';
            return this.__getDoRISDocument('GUID: ' + newDocumentData.guid + ';', dorisConfiguration);
        }).then(newDocument => {
            if (!newDocument) throw 'dorisReadNewDocumentFailure';
            return {
                id: newDocument.id,
                type: newDocumentData.type.name
            };
        }).catch(errorId => {
            this.__showErrorMessage(errorId);
            return undefined;
        });
    };

    Plugin.__updateLfdNrInDoRIS = function(newDocumentData, dorisConfiguration) {
        const query = 'SELECT id, maxnr FROM GZLfdNr WHERE GZ: ' + newDocumentData.type.id + '//;'
    
        return this.__getDoRISQueryResult(query, ['maxnr'], dorisConfiguration).then(data => {
            if (!data || !data.length || !data[0].length) return undefined;

            const lfdNr = (parseInt(data[0][0]) + 1).toString();
            return this.__modifyViaDoRISQuery(query, ['maxnr'], [lfdNr], dorisConfiguration).then(result => {
                return result ? lfdNr : undefined;
            })
        });
    };

    Plugin.__getDoRISQueryResult = function(query, fieldNames, dorisConfiguration) {
        const params = new URLSearchParams({
            username: dorisConfiguration.username,
            password: dorisConfiguration.password,
            query,
            startIndex: 0,
            endIndex: 9
        });

        fieldNames.forEach(fieldName => params.append('fieldNames[]', fieldName));

        const url = dorisConfiguration.url + 'services/rest/getQueryResult?' + params.toString();

        return this.__performGetRequest(url);
    };

    Plugin.__modifyViaDoRISQuery = function(query, fieldNames, fieldValues, dorisConfiguration) {
        const requestData = {
            username: dorisConfiguration.username,
            password: dorisConfiguration.password,
            query,
            fieldNames,
            fieldValues
        };

        return this.__performPostRequest(dorisConfiguration.url + 'services/rest/modify', requestData);
    };

    Plugin.__getDoRISDocument = function(query, dorisConfiguration) {
        const fieldNames = ['ROWNUMBER', 'GZ2', 'AKTEINH', 'AENDAM', 'AENDUM'];

        const params = new URLSearchParams({
            username: dorisConfiguration.username,
            password: dorisConfiguration.password,
            query
        });

        fieldNames.forEach(fieldName => params.append('fieldNames[]', fieldName));

        const url = dorisConfiguration.url + 'services/rest/getDocument?' + params.toString();
        
        return this.__performGetRequest(url).then(documentValues => {
            if (!documentValues) return undefined;

            return {
                id: documentValues[0],
                documentReference: documentValues[1],
                content: documentValues[2],
                changeDate: documentValues[3],
                changeTime: documentValues[4]
            };
        });
    };

    Plugin.__addDoRISDocument = function(documentData, dorisConfiguration, organizationUnit) {
        const fields = {
            GUID: documentData.guid,
            AZ: documentData.type.id,
            GZLFDNR: documentData.lfdNr,
            GZAKTE: documentData.type.id + '-' + documentData.lfdNr,
            GZJAHR: documentData.creationYear,
            TYP: 'Akte',
            AKTENTYP: documentData.type.name,
            AKTEINH: documentData.content,
            OE: organizationUnit,
            AUSBLEND: 'N',
            FORTSETZ: 'N',
            NACHGJN: 'N',
            TEMPLATE: 'DA',
            LFDNR: '0',
            PAPERJN: 'N',
            ERSTNAME: dorisConfiguration.fullName,
            ERSTAM: documentData.creationDate,
            ERSTUM: documentData.creationTime,
            AENDNAME: dorisConfiguration.fullName,
            AENDAM: documentData.creationDate,
            AENDUM: documentData.creationTime,
            ACCESS: documentData.type.access
        };

        const requestData = {
            username: dorisConfiguration.username,
            password: dorisConfiguration.password,
            fieldNames: Object.keys(fields),
            fieldValues: Object.values(fields)
        };
        
        return this.__performPostRequest(dorisConfiguration.url + 'services/rest/addNew', requestData);
    };

    Plugin.__getOrganizationUnit = function(documentData, dorisConfiguration) {
        return documentData.type.organization_unit?.length
            ? documentData.type.organization_unit
            : dorisConfiguration.organizationUnit;
    };

    Plugin.__performGetRequest = function(url) {
        return fetch(url, {
            method: 'GET',
        }).then(response => {
            if (!response.ok) console.error(response.status);
            if (response.status !== 200) return 'noResults';
            return response.arrayBuffer();
        }).then(buffer => {
            if (buffer === 'noResults') return [];
            const decodedText = new TextDecoder('iso-8859-1').decode(buffer);
            return JSON.parse(decodedText);
        }).catch(err => {
            console.error(err);
            return undefined;
        });
    };

    Plugin.__performPostRequest = function(url, requestData) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        }).then(response => {
            if (!response.ok) {
                console.error(response.status);
                return undefined;
            }
            return response.json();
        }).catch(err => {
            console.error(err);
            return undefined;
        });
    };

    Plugin.__getDoRISConfiguration = function() {
        const userConfiguration = ez5.session.user.opts.user.user;
        const dorisPluginConfiguration = userConfiguration.custom_data;
        const baseConfiguration = this.__getBaseConfiguration();

        let url = baseConfiguration.url;
        if (!url.endsWith('/')) url += '/';

        return {
            username: dorisPluginConfiguration.doris_username,
            password: dorisPluginConfiguration.doris_password,
            organizationUnit: dorisPluginConfiguration.doris_organization_unit,
            fullName: userConfiguration.first_name + ' ' + userConfiguration.last_name,
            url
        }
    };

    Plugin.__getBaseConfiguration = function() {
        return ez5.session.getBaseConfig('plugin', 'custom-data-type-doris')['doris'];
    };

    Plugin.__hasLoginData = function(dorisConfiguration) {
        return dorisConfiguration.username && dorisConfiguration.password;
    };

    Plugin.__showErrorMessage = function(errorId) {
        const modal = new CUI.Modal({
            pane: {
                header_left: new CUI.Label({ text: $$('custom.data.type.doris.error.' + errorId + '.title') }),
                content: new CUI.Label({
                    text: $$('custom.data.type.doris.error.' + errorId + '.message'),
                    multiline: true
                }),
                footer_right: [
                    new CUI.Button({
                        text: $$('custom.data.type.doris.ok'),
                        class: 'cui-dialog',
                        primary: true,
                        onClick: () => this.__closeModal(modal)
                    })
                ]
            }
        });

        modal.autoSize();

        return modal.show();
    };

    Plugin.__closeModal = function(modal) {
        modal.hide();
        modal.destroy();
    };

    Plugin.__getObjectType = function() {
        const path = this.path();
        return path.includes('.')
            ? path.slice(0, path.indexOf('.'))
            : path;
    };

    return CustomDataTypeDoRIS;
})(CustomDataType);


CustomDataType.register(CustomDataTypeDoRIS);
