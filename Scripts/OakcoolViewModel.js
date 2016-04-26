var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", 'AreaViewModel'], function (require, exports, vm) {
    "use strict";
    var OakcoolViewModel = (function (_super) {
        __extends(OakcoolViewModel, _super);
        function OakcoolViewModel(main) {
            _super.call(this, main);
            this.isMe(true);
            this.name("mateus carvalho");
            this.subName("oakcool");
            this.action = this.doAction;
            this.image("Content/mateusthoughtful.png");
            this.calculateHeight();
        }
        OakcoolViewModel.prototype.doAction = function () {
            this.main.show(this);
        };
        return OakcoolViewModel;
    }(vm.AreaViewModel));
    exports.OakcoolViewModel = OakcoolViewModel;
});
//# sourceMappingURL=OakcoolViewModel.js.map