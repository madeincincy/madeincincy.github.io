var App = {
    init: function($ctx){
        for (var key in App.fn) {
            if(App.fn[key].hasOwnProperty('init')){
                App.fn[key].init($ctx);
            }
        }
    },
    fn: {
        form: {
            init: function($ctx){
                $ctx.find('.delete-form').each(function(){
                    $form = $(this);
                    var repo = App.gh.getRepo();
                    if(window.location.hash !== ""){
                        var path = window.location.hash.substr(1);
                        $form.find('input[name=path]').val(path);
                    }
                });
                $ctx.find('.delete-form').submit(function(){
                    $form.children('fieldset').attr('disabled','disabled');
                    $form = $(this);
                    var properties = {
                        date: new Date().getTime()
                    };
                    $form.find('fieldset > .form-group').each(function(idx, fieldGroup){
                        $fields = $($(fieldGroup).find('input'));
                        $fields.each(function(idx, field){
                            properties[$(field).attr('name')]=$(field).val();
                        });
                    });
                    if(!(properties.created)){
                        properties.creative = new Date().getTime();
                    }
                    var page = jsyaml.safeDump(properties);
                    console.log("Delete request "+page);
                    var path = window.location.hash.substr(1);
                    
                    var issues = App.gh.getIssues();
                    
                    issues.createIssue({
                        "title": "Delete Request for "+path+" by "+properties.author+" on "+new Date().toLocaleDateString(),
                        "body": page,
                        "assignee": "klcodanr",
                        "labels": [
                            "content"
                        ]
                    }, function(err, res){
                        $form.children('fieldset').removeAttr('disabled');
                        if(err){
                            App.ui.alert("danger","Unable to submit deletion due to unexpected exception, please <a href='/contact'>Contact Us</a>");
                            console.log(err);
                        } else {
                            App.ui.alert("success","Deletion submitted successfully. Changes should be reflected within 24-48 hours.");
                        }
                    });
                    return false;
                });
                $ctx.find('.github-form').each(function(){
                    $form = $(this);
                    var repo = App.gh.getRepo();
                    if(window.location.hash !== ""){
                        var path = window.location.hash.substr(1);
                        $form.children('fieldset').attr('disabled','disabled');
                        repo.getContents("master", path, true, function(err, res){
                            var parts = res.split('---');
                            $form.find('textarea[name=content]').data("wysihtml5").editor.setValue(parts[2]);
                            $form.find('input[name=path]').val(path);
                            
                            var properties = jsyaml.safeLoad(parts[1]);
                            $form.find('.form-group').each(function(idx, fieldGroup){
                                if($(fieldGroup).hasClass('repeating-parent')){
                                    var key = $(fieldGroup).attr('data-name');
                                    if(properties[key]){
                                        properties[key].forEach(function(item,idx){
                                            var $newItem = $(App.fn.repeating.repeatingAdd($(fieldGroup).find('.repeating-add')));
                                            $newItem.find('input').val(item);
                                        });
                                    }
                                } else {
                                    $field = $($(fieldGroup).find('input'));
                                    $field.val(properties[$field.attr('name')]);
                                }
                            });
                        });
                        $form.children('fieldset').removeAttr('disabled');
                    }
                });
                $ctx.find('.github-form').submit(function(){
                    $form.children('fieldset').attr('disabled','disabled');
                    $form = $(this);
                    var properties = {
                        date: new Date().getTime()
                    };
                    $form.find('fieldset > .form-group').each(function(idx, fieldGroup){
                        if($(fieldGroup).hasClass('repeating-parent')){
                            var key = $(fieldGroup).attr('data-name');
                            var values = [];
                            $fields = $($(fieldGroup).find('.repeating-container input'));
                            $fields.each(function(idx, field){
                                values.push($(field).val());
                            });
                            properties[key] = values;
                        } else {
                            if($(fieldGroup).find('textarea[name=content]').length > 0){
                                // skip
                            } else {
                                $fields = $($(fieldGroup).find('input'));
                                $fields.each(function(idx, field){
                                    properties[$(field).attr('name')]=$(field).val();
                                });
                            }
                        }
                    });
                    var page = "---\n"+jsyaml.safeDump(properties)+"\n---\n\n"+$form.find('textarea[name=content]').val();
                    console.log("Updated content "+page);
                    var path = null;
                    if(window.location.hash === ""){
                        path = $('input[name=path]').val()+properties.title.toLowerCase().replace(/\W/g,'-')+'.html';
                    } else {
                        path = window.location.hash.substr(1);
                    }
                    
                    var issues = App.gh.getIssues();
                    
                    issues.createIssue({
                        "title": "Update "+path+" by "+properties.author+" on "+new Date().toLocaleDateString(),
                        "body": page,
                        "assignee": "klcodanr",
                        "labels": [
                            "content"
                        ]
                    }, function(err, res){
                        $form.children('fieldset').removeAttr('disabled');
                        if(err){
                            App.ui.alert("danger","Unable to submit update due to unexpected exception, please <a href='/contact'>Contact Us</a>");
                            console.log(err);
                        } else {
                            App.ui.alert("success","Update submitted successfully. Changes should be reflected within 24-48 hours.");
                        }
                    });
                    return false;
                });
            }
        },
        repeating: {
            repeatingAdd: function($btn){
                var html = $btn.closest('.repeating-parent').find('.repeating-template').first().html();
                var $container = $btn.closest('.row').siblings('.repeating-container');
                var $div = $('<div class="repeating-item"></div>');
                $div.append(html);
                var current = parseInt($container.attr('data-current'),10);
                $container.attr('data-current', current + 1);
                App.init($div);
                $container.append($div);
                return $div;
            },
            repeatingRemove: function(){
                $(this).closest('.repeating-item').remove();
                return false;
            },
            init: function($ctx){
                $ctx.find('.repeating-add').click(function(){
                    App.fn.repeating.repeatingAdd($(this));
                    return false
                });
                $ctx.find('.repeating-remove').click(App.fn.repeating.repeatingRemove);
            }
        },
        wysiwyg: {
            init: function($ctx){
                $ctx.find('.wysiwyg').wysihtml5();
            }
        }
    },
    gh: {
        accessToken: 'ZTZiZWFiNmRlZTI4N2U0YzBkMGNiNjgzMGVlY2FjY2QzZGY1NmU1NQ==',
        getIssues: function(){
            var gh = new GitHub({
                token: atob(App.gh.accessToken)
            });
            return gh.getIssues("madeincincy/madeincincy.github.io");
        },
        getRepo: function(){
            var gh = new GitHub();
            return gh.getRepo("madeincincy","madeincincy.github.io");
        }
    },
    ui: {
        alert: function(level, message){
            $alert = $('<div class="alert alert-'+level+'">'+message+'</div>');
            $('.main').prepend($alert);
            setTimeout(function(){
                $alert.remove();
            }, 10000);
            window.scrollTo(0, 0);
        }
    },
    util:{
        
    }
};
$(document).ready(function() {
    App.init($(document));
	$('form').submit(function(){
		var analyticsId = $(this).attr('data-analytics-id');
		ga('send', 'event', 'Form', 'Submit', analyticsId);
	});
});