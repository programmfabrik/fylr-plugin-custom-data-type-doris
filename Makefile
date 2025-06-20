ZIP_NAME ?= "CustomDataTypeDoRIS.zip"
PLUGIN_NAME = custom-data-type-doris

all: build zip

build: clean buildinfojson
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

	cp manifest.master.yml build/$(PLUGIN_NAME)/manifest.yml
	cp build-info.json build/$(PLUGIN_NAME)/build-info.json

clean:
	rm -rf build

zip:
	cd build && zip $(ZIP_NAME) -r $(PLUGIN_NAME)/
	cp -r build/$(PLUGIN_NAME)/* build/
	rm -rf build/${PLUGIN_NAME}

buildinfojson:
	repo=`git remote get-url origin | sed -e 's/\.git$$//' -e 's#.*[/\\]##'` ;\
	rev=`git show --no-patch --format=%H` ;\
	lastchanged=`git show --no-patch --format=%ad --date=format:%Y-%m-%dT%T%z` ;\
	builddate=`date +"%Y-%m-%dT%T%z"` ;\
	echo '{' > build-info.json ;\
	echo '  "repository": "'$$repo'",' >> build-info.json ;\
	echo '  "rev": "'$$rev'",' >> build-info.json ;\
	echo '  "lastchanged": "'$$lastchanged'",' >> build-info.json ;\
	echo '  "builddate": "'$$builddate'"' >> build-info.json ;\
	echo '}' >> build-info.json
