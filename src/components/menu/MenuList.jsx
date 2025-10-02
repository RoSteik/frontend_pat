import MenuItem from './MenuItem';

function MenuList({ menuItems }) {
    const categories = ['appetizer', 'main', 'dessert', 'drink'];

    const groupedItems = categories.reduce((acc, category) => {
        acc[category] = menuItems.filter(item => item.category === category);
        return acc;
    }, {});

    const categoryNames = {
        appetizer: 'Закуски',
        main: 'Основні страви',
        dessert: 'Десерти',
        drink: 'Напої'
    };

    return (
        <div className="menu-list">
            <h2>Меню</h2>
            {categories.map(category => (
                groupedItems[category].length > 0 && (
                    <div key={category} className="menu-category">
                        <h3>{categoryNames[category]}</h3>
                        <div className="menu-items">
                            {groupedItems[category].map(item => (
                                <MenuItem key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}

export default MenuList;