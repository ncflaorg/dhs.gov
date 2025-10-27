(function ($) {
    $(document).ready(function () {
        $('video, audio').each(function (index, element) {
            if ($(element).data('able-player') !== undefined) {
                // these already have ableplayer added to them
            } else {
                AblePlayerInstances.push(new AblePlayer($(this), $(element)));
            }
        });
    });

})(jQuery);
