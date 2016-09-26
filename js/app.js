$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

var App = {
    init: function($ctx){
        for (var key in App.fn) {
            if(App.fn[key].hasOwnProperty('init')){
                App.fn[key].init($ctx);
            }
        }
    },
    fn: {
        filter: {
            init: function($ctx){
                $ctx.find('form[data-toggle=filter]').each(function(idx, filter){
                    var $filter = $(filter);
                    var target = $filter.attr('data-target');
                    $filter.find('input[name=term]').keyup(function(){
                        var term = $(this).val();
                        $(target).hide();
                        $(target+":contains("+term+")").show();
                        $filter.parents('.navbar').find('.badge').text($(target+":visible").length);
                    });
                });
            }
        },
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
                        date: new Date().toUTCString()
                    };
                    $form.find('fieldset > .form-group').each(function(idx, fieldGroup){
                        $fields = $($(fieldGroup).find('input'));
                        $fields.each(function(idx, field){
                            properties[$(field).attr('name')]=$(field).val();
                        });
                    });
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
                                            $newItem.find('input,select').val(item);
                                            $newItem.find('img').attr('src',item);
                                        });
                                    }
                                } else {
                                    $fields = $($(fieldGroup).find('input,select'));
                                    $fields.each(function(idx, field){
                                        $(field).val(properties[$(field).attr('name')]);
                                    });
                                    $images = $($(fieldGroup).find('img'));
                                    $images.each(function(idx, img){
                                        $(img).attr('src',properties[$(img).attr('data-key')]);
                                    });
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
                        date: new Date()
                    };
                    $form.find('fieldset > .form-group').each(function(idx, fieldGroup){
                        if($(fieldGroup).hasClass('repeating-parent')){
                            var key = $(fieldGroup).attr('data-name');
                            var values = [];
                            $fields = $($(fieldGroup).find('.repeating-container input,.repeating-container select'));
                            $fields.each(function(idx, field){
                                values.push($(field).val());
                            });
                            properties[key] = values;
                        } else {
                            if($(fieldGroup).find('textarea[name=content]').length > 0){
                                // skip
                            } else {
                                $fields = $($(fieldGroup).find('input,select'));
                                $fields.each(function(idx, field){
                                    properties[$(field).attr('name')]=$(field).val();
                                });
                            }
                        }
                    });
                    
                    if(properties.created == ''){
                        properties.created = new Date();
                    } else {
                        properties.created = new Date(Date.parse(properties.created));
                    }
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
        imgurUpload: {
            init: function($ctx){
                var  acceptedTypes = {
                  'image/png': true,
                  'image/jpeg': true,
                  'image/gif': true
                }
                $ctx.find('.droptarget').each(function(idx,target){
                    var $container = $(this).closest('.upload-container');
                    var $target = $(target);
                    $target.bind('dragover',function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        $target.addClass('hover');
                    }).bind('dragleave',function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        $target.removeClass('hover').removeClass('hover');
                    });
                    target.ondrop = function (e) {
                        $target.addClass('loading');
                        e.preventDefault();
                        if(e.dataTransfer.files.length != 0){
                            var file = e.dataTransfer.files[0];
                            if(acceptedTypes[file.type] === true){
                                var formData = new FormData();
                                formData.append("image", file);
                                $.ajax({
                                    url: "https://api.imgur.com/3/image",
                                    type: "POST",
                                    datatype: "json",
                                    headers: {
                                        "Authorization": "Client-ID 7ea0510aabb4b40"
                                    },
                                    data: formData,
                                    success: function(response) {
                                        $container.find('input').val(response.data.link);
                                        var reader = new FileReader();
                                        reader.onload = function (event) {
                                            $target.removeClass('loading');
                                            $container.find('img').attr('src',event.target.result);
                                        };
                                        reader.readAsDataURL(file);
                                        var photo_hash = response.data.deletehash;
                                    },
                                    cache: false,
                                    contentType: false,
                                    processData: false
                                });
                            } else {
                                $target.removeClass('loading');
                                App.ui.alert('danger','Invalid file type for file: '+file.name);
                            }
                        } else {
                            $target.removeClass('loading');
                            App.ui.alert('danger','Please specify an image file');
                        }
                    };
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
    $('.home-block').click(function(){
        window.location = $(this).find('a').attr('href');
    })
});