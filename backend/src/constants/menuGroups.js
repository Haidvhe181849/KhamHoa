const MENU_GROUPS = ['TRANG_SUC', 'PHU_KIEN', 'QUA_TANG'];

const MENU_GROUP_LABELS = {
    TRANG_SUC: 'Trang Sức',
    PHU_KIEN: 'Phụ Kiện',
    QUA_TANG: 'Quà Tặng'
};

const isValidMenuGroup = (value) => MENU_GROUPS.includes(value);

module.exports = {
    MENU_GROUPS,
    MENU_GROUP_LABELS,
    isValidMenuGroup
};
