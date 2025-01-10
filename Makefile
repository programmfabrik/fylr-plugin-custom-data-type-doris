ZIP_NAME ?= "CustomDataTypeDoRIS.zip"
PLUGIN_NAME = custom-data-type-doris

all: build zip

build: clean
	mkdir -p build
	mkdir -p build/$(PLUGIN_NAME)
	mkdir -p build/$(PLUGIN_NAME)/webfrontend
	mkdir -p build/$(PLUGIN_NAME)/server
	mkdir -p build/$(PLUGIN_NAME)/server/extension
	mkdir -p build/$(PLUGIN_NAME)/l10n

	cp src/webfrontend/js/customDataType.js build/$(PLUGIN_NAME)/webfrontend/$(PLUGIN_NAME).js
	cat src/webfrontend/js/userPlugin.js >> build/$(PLUGIN_NAME)/webfrontend/${PLUGIN_NAME}.js
	cp src/webfrontend/css/main.css build/$(PLUGIN_NAME)/webfrontend/${PLUGIN_NAME}.css
	cp src/server/extension/data.js build/$(PLUGIN_NAME)/server/extension/data.js
	cp src/server/extension/credentials.js build/$(PLUGIN_NAME)/server/extension/credentials.js
	cp l10n/$(PLUGIN_NAME).csv build/$(PLUGIN_NAME)/l10n/$(PLUGIN_NAME).csv

	cp serverConfiguration.json build/$(PLUGIN_NAME)/serverConfiguration.json
	cp manifest.master.yml build/$(PLUGIN_NAME)/manifest.yml

clean:
	rm -rf build

zip:
	cd build && zip $(ZIP_NAME) -r $(PLUGIN_NAME)/
	cp -r build/$(PLUGIN_NAME)/* build/
	rm -rf build/${PLUGIN_NAME}
