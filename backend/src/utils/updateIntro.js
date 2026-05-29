const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Introduction = require('../models/Introduction');

dotenv.config({ path: './.env' });

const newStory = [
    {
        type: 'history',
        title: 'Xà cừ là gì? Huyền thoại về ánh sáng đa sắc',
        content: '<p>Xà cừ không đơn thuần là lớp vỏ cứng của loài nhuyễn thể. Đó là sự kết tinh của hàng chục năm hấp thụ tinh túy từ đại dương. Cấu trúc gồm các lớp tinh thể Aragonite siêu mỏng đan xen nhau, tạo nên hiện tượng nhiễu xạ ánh sáng. Khi bạn nghiêng một chiếc lược hay một chiếc cúc áo xà cừ, màu sắc sẽ chuyển động như những dải cầu vồng rực rỡ – điều mà không một loại nhựa nhân tạo nào có thể sao chép được.</p>',
        image: { url: '/images/macro_mother_of_pearl_iridescent.png' } 
    },
    {
        type: 'process',
        title: 'Hành trình từ vỏ thô đến tuyệt tác mỹ nghệ',
        content: `
            <p>Để tạo ra một sản phẩm hoàn thiện tại KhamHoaStore, mỗi mảnh xà cừ phải trải qua một quy trình chế tác khắt khe:</p>
            <ul>
                <li><strong>Tuyển chọn:</strong> Chỉ những vỏ trai, vỏ ốc có tuổi đời lâu năm, độ dày và sắc tầng đạt chuẩn mới được đưa vào chế tác.</li>
                <li><strong>Mài phẳng & Cắt tạo hình:</strong> Đây là công đoạn đòi hỏi sự kiên nhẫn tuyệt đối. Nghệ nhân phải mài đi lớp vỏ xù xì bên ngoài để lộ ra "lớp thịt" xà cừ lấp lánh bên trong.</li>
                <li><strong>Đánh bóng thủ công:</strong> Không sử dụng hóa chất độc hại, chúng tôi đánh bóng bằng kỹ thuật truyền thống để giữ trọn vẹn độ tự nhiên và bền bỉ theo thời gian.</li>
            </ul>
        `,
        image: { url: '/images/artisan_hands_polishing_shell.png' }
    },
    {
        type: 'material',
        title: 'Tại sao nên chọn sản phẩm từ Xà Cừ?',
        content: `
            <p>Mỗi sản phẩm xà cừ là độc bản. Bởi lẽ, vân cát và sắc thái ánh sáng trên mỗi vỏ trai là hoàn toàn khác nhau. Sở hữu một chiếc gương khảm xà cừ hay những chiếc cúc áo trên áo sơ mi không chỉ thể hiện gu thẩm mỹ tinh tế, mà còn là cách bạn ủng hộ giá trị bền vững (Eco-friendly) và tôn vinh đôi bàn tay tài hoa của người thợ Việt.</p>
            <blockquote style="border-left: 4px solid var(--primary); padding-left: 1rem; font-style: italic; margin-top: 2rem; color: var(--primary);">
                "Xà cừ không chỉ là chất liệu, đó là món quà từ biển cả dành cho những ai trân trọng vẻ đẹp vĩnh cửu."
            </blockquote>
        `,
        image: { url: '/images/flatlay_collection_finished_products.png' }
    }
];

const updateStory = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Đang cập nhật câu chuyện thương hiệu...');

        // Delete only history, process, material types
        await Introduction.deleteMany({ type: { $in: ['history', 'process', 'material'] } });
        
        await Introduction.insertMany(newStory);
        
        console.log('--- CẬP NHẬT CÂU CHUYỆN THÀNH CÔNG! ---');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateStory();
