
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
                $ctx.find('.github-form').each(function(){
                    var repo = App.gh.getRepo();
                    var path = window.location.hash.substr(1);
                    if(path != ""){
                        repo.getContents("master", path, true, function(){
                            
                        })
                    }
                });
            }
        },
        repeating: {
            init: function($ctx){
                var repeatingRemove = function(){
                    $(this).closest('.repeating-item').remove();
                    return false;
                }
                $ctx.find('.repeating-add').click(function() {
                    var html = $(this).closest('.repeating-parent').find('.repeating-template').first().html();
                    var $container = $(this).closest('.row').siblings('.repeating-container');
                    var $div = $('<div class="repeating-item"></div>');
                    $div.append(html);
                    var current = parseInt($container.attr('data-current'),10);
                    $div.find('input,select,textarea').each(function(idx, elem){
                        if($(elem).attr('name')){
                            $(elem).attr('name',$(elem).attr('name').replace('[]','['+current+']'));
                        }
                    });
                    $container.attr('data-current', current + 1);
                    App.init($div);
                    $container.append($div);
                    return false;
                });
                $ctx.find('.repeating-remove').click(repeatingRemove);
            }
        },
        wysiwyg: {
            init: function($ctx){
                $ctx.find('.wysiwyg').wysihtml5();
            }
        }
    },
    gh: {
        getRepo: function(){
            var gh = new GitHub();
            return gh.getRepo("madeincincy","madeincincy.github.io");
        }
    },
    util:{
        
    }
};
$(document).ready(function() {
    App.init($(document));
});