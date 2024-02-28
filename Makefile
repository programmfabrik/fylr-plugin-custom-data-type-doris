ZIP_NAME ?= "CustomDataTypeDoRIS.zip"
PLUGIN_NAME = custom-data-type-doris

MAIN_JS = src/webfrontend/js/main.js
MAIN_CSS = src/webfrontend/css/main.css

all: build zip

build: clean
	mkdir -p build
	mkdir -p build/$(PLUGIN_NAME)
	mkdir -p build/$(PLUGIN_NAME)/webfrontend
	mkdir -p build/$(PLUGIN_NAME)/server
	mkdir -p build/$(PLUGIN_NAME)/l10n

	cp $(MAIN_JS) build/$(PLUGIN_NAME)/webfrontend/$(PLUGIN_NAME).js
	cp $(MAIN_CSS) build/$(PLUGIN_NAME)/webfrontend/${PLUGIN_NAME}.css
	cp l10n/$(PLUGIN_NAME).csv build/$(PLUGIN_NAME)/l10n/$(PLUGIN_NAME).csv

	cp manifest.master.yml build/$(PLUGIN_NAME)/manifest.yml

clean:
	rm -rf build

zip:
	cd build && zip $(ZIP_NAME) -r $(PLUGIN_NAME)/
	cp -r build/$(PLUGIN_NAME)/* build/
	rm -rf build/${PLUGIN_NAME}
