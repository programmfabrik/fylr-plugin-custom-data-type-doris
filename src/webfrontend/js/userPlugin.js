var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp = {}.hasOwnProperty;

var UserPluginDoRIS = (function(superClass) {
    extend(UserPluginDoRIS, superClass);

    function UserPluginDoRIS() {
        return UserPluginDoRIS.__super__.constructor.apply(this, arguments);
    }

    const Plugin = UserPluginDoRIS.prototype;

    Plugin.getTabs = function(tabs) {
		tabs.push({
			name: 'doris',
			text: 'DoRIS',
			content: () => {
				form = new CUI.Form({
					data: this._user.data.user,
					name: 'custom_data',
					fields: [{
						type: CUI.Input,
						name: 'doris_username',
						form: {
							label: $$('userPlugin.doris.username.label'),
							hint: $$('userPlugin.doris.username.hint')
                        }
                    }, {
						type: CUI.Input,
						name: 'doris_password',
						form: {
							label: $$('userPlugin.doris.password.label'),
							hint: $$('userPlugin.doris.password.hint')
                        }
                    }, {
						type: CUI.Input,
						name: 'doris_organization_unit',
						form: {
							label: $$('userPlugin.doris.organizationUnit.label'),
							hint: $$('userPlugin.doris.organizationUnit.hint')
                        }
                    }]
                });
				return form.start();
            }
        });
    }

	Plugin.getSaveData = function(saveData) {
		saveData.user.custom_data.doris_username = this._user.data.user.custom_data.doris_username;
        saveData.user.custom_data.doris_password = this._user.data.user.custom_data.doris_password;
		saveData.user.custom_data.doris_organization_unit = this._user.data.user.custom_data.doris_organization_unit;
    }

	Plugin.isAllowed = function() {
        return true;
    }

    return UserPluginDoRIS;
})(ez5.UserPlugin);


User.plugins.registerPlugin(UserPluginDoRIS);
