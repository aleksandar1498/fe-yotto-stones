import { motion } from "framer-motion";

const items = [
  {
    title: "Первази за прозорци", // Windowsills
    // image: "/images/windowsill.jpg",
    image: "/assets/images/window-sill.jpg",
    description: "Елегантно допълнение към всеки прозорец, изработено с внимание към детайла."
  },
  {
    title: "Кухненски плотове", // Kitchen countertop
    // image: "/images/kitchen-countertop.jpg",
    image: "/assets/images/countertop-kitchen.jpg",
    description: "Висококачествени материали за перфектна естетика и функционалност."
  },
  {
    title: "Каминна облицовка", // Fireplace cover
    image: "/assets/images/fireplace.jpg",
    description: "Добавете луксозен акцент към вашия дом с естествен камък."
  },
  {
    title: "Стълби", // Stairs
    // image: "/images/stairs.jpg",
    image: "https://marmogranito.it/wp-content/uploads/2023/01/Scale-1024x576.png.webp",

    description: "Стилни и здрави стълби от мрамор и гранит за устойчивост и елегантност."
  },
  {
    title: "Прагoве", // Thresholds
    // image: "/images/thresholds.jpg",
    image: "https://marmogranito.it/wp-content/uploads/2022/11/Soglia-1024x576.png.webp",
    description: "Функционални и изискани прагчета за завършен вид на вашето пространство."
  },
  {
    title: "Стенни/Подови облицовки", // Wall covers
    image: "/assets/images/flooring.jpg",
    description: "Неповторими текстури и дизайни за вашите стени."
  },
  {
    title: "Други", // Wall coverings
    image: "/assets/images/accessories.jpg",
    description: "Изтънчени решения за вътрешен и външен дизайн."
  }
];
export default function CompanyOfferings() {
  return (
    <section className="py-20 px-8 bg-gray-100 text-gray-900" id="offerings">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
        <div className="text-center">
          <p className='text-3xl tracking-widest  uppercase subtitle pb-4'>  Нашите изделия </p>
          <p className="text-lg mb-6">
            Продукти от мрамор, варовик и гранит , подходящи за
            строителство, ремонт и обновяване на жилищни и търговски пространства.
          </p>
          <p className="text-lg font-semibold italic">
            Избягайте от масовото производство, изберете детайлната и персонализирана специализирана работа.
          </p>
        </div>
        {/* <div className="md:w-1/2 flex justify-center relative">
          <img src="/assets/images/materials-bg.jpg" alt="Construction planning" className="max-w-full max-h-[80%]" />
        </div> */}
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 pb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="relative group overflow-hidden rounded-lg shadow-md"
            // whileHover={{ scale: 1.1, transition: ".3s" }}
            initial={{ y: 0, opacity: 0 }}
            whileInView={{ y: 100, opacity: 1 }}
            // animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.3 }}
          >
            <img src={item.image} alt={item.title} className="w-full h-96 object-cover rounded-lg" />
            <div className="absolute inset-0 text-center w-full text-darkGold hover:text-royalGold  z-20 ">
              <h3 className="text-2xl font-bold space-x-4 p-4 ">{item.title}</h3>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center text-white p-4">
              <p className="text-lg text-center mt-2 py-8 max-w-[90%]">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
