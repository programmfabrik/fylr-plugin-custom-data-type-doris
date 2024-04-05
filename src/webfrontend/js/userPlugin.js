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
							label: 'Username',
							hint: 'Der Username des DoRIS-Accounts'
                        }
                    }, {
						type: CUI.Input,
						name: 'doris_password',
						form: {
							label: 'Passwort',
							hint: 'Das Passwort des DoRIS-Accounts'
                        }
                    }]
                });
				return form.start();
            }
        })
    }

	Plugin.getSaveData = function(saveData) {
		saveData.user.custom_data.doris_username = this._user.data.user.custom_data.doris_username;
        saveData.user.custom_data.doris_password = this._user.data.user.custom_data.doris_password;
    }

	Plugin.isAllowed = function() {
        return true;
    }

    return UserPluginDoRIS;
})(ez5.UserPlugin);


User.plugins.registerPlugin(UserPluginDoRIS);
